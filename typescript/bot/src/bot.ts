import {
    Client,
    ClientEvents,
    Events,
    GatewayIntentBits,
    Message,
} from 'discord.js'
import { CommandManager } from './command/command_manager'
import { LocalizationManager } from './localization/localization_manager'
import { Logger } from 'commons/lib/log'
import { AsyncInitializer } from './types/initialization'
import { Result, Results } from 'commons/lib/utils/result'
import { timeout, wrapRace } from 'commons/lib/utils/promise'
import { seconds } from 'commons/lib/utils/time'

function discordClientOncePromise<Event extends keyof ClientEvents>(
    client: Client,
    event: Event
): Promise<ClientEvents[Event]> {
    return new Promise((resolve) => {
        client.once(event, (...args: ClientEvents[Event]) => {
            resolve(args)
        })
    })
}

export class BotInitializer implements AsyncInitializer<Bot, unknown> {
    async initialize(
        deps: Omit<Bot['deps'], 'discordClient'>,
        args: { token: string }
    ): Promise<Result<Bot, unknown>> {
        const client = new Client({
            intents: [
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
            ],
        })

        const login = await Results.wrapErrorAsync(() =>
            client.login(args.token)
        )
        if (Results.isErr(login)) {
            return login
        }

        const ready = await wrapRace([
            discordClientOncePromise(client, 'ready'),
            timeout(seconds(1)),
        ])

        if (Results.isErr(ready)) {
            return ready
        }

        return new Bot({
            ...deps,
            discordClient: client as Client<true>,
        })
    }
}

export class Bot {
    private eventHandlers: {
        [Event in keyof ClientEvents]?: (
            ...args: ClientEvents[Event]
        ) => Promise<void> | void | undefined
    }

    private hasRegisteredEventHandlers = false

    constructor(
        private deps: {
            discordClient: Client<true>
            logger: Logger
            commandManager: CommandManager
            localizationManager: LocalizationManager
        }
    ) {
        this.eventHandlers = {
            messageCreate: this.onMessage.bind(this),
            warn: this.deps.logger.warn.bind(this.deps.logger),
            error: this.deps.logger.error.bind(this.deps.logger),
            debug: this.deps.logger.debug.bind(this.deps.logger),
        }
        this.registerEventHandlers()
        this.deps.logger.info('Initialization complete')
    }

    async [Symbol.asyncDispose]() {
        this.unregisterEventHandlers()
        await this.deps.discordClient.destroy()
    }

    onMessage(message: Message<boolean>): void {
        this.deps.logger.info('New message', message.content)
    }

    private registerEventHandlers() {
        this.hasRegisteredEventHandlers = true
        this.deps.logger.debug('Registering event handlers')
        for (const [event, callback] of Object.entries(this.eventHandlers)) {
            this.deps.discordClient.on(event, callback)
        }
    }

    private unregisterEventHandlers() {
        if (!this.hasRegisteredEventHandlers) {
            return
        }
        this.deps.logger.debug('Removing event handlers')
        this.hasRegisteredEventHandlers = false
        for (const [event, callback] of Object.entries(this.eventHandlers)) {
            this.deps.discordClient.off(event, callback)
        }
    }
}
