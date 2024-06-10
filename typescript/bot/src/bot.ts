import { Client, ClientEvents, GatewayIntentBits, Message } from 'discord.js'
import { CommandManager } from './command/command_manager'
import { LocalizationManager } from './localization/localization_manager'
import { Logger } from 'commons/lib/log'
import { AsyncInitializer } from './types/initialization'
import { Result, Results, ValueResult } from 'commons/lib/utils/result'
import { timeout, wrapRace } from 'commons/lib/utils/promise'
import { seconds } from 'commons/lib/utils/time'
import { ConfigurationManager } from './configuration/configuration_manager'
import { Commander } from './command/commander'
import { paddingFor } from 'commons/lib/utils/string'

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
            commander: Commander
            commandManager: CommandManager
            localizationManager: LocalizationManager
            configurationManager: ConfigurationManager
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

    async onMessage(message: Message<boolean>): Promise<void> {
        if (!message.guildId) {
            return
        }
        const prefix = await this.deps.configurationManager.guild(
            message.guildId,
            'commandPrefix'
        )
        if (Results.isErr(prefix)) {
            return
        }
        const aliasTrees = (
            await Promise.allSettled([
                this.deps.localizationManager.getSubmodule(
                    'en_us',
                    'alias_tree'
                ),
                this.deps.localizationManager.getSubmodule(
                    'pt_br',
                    'alias_tree'
                ),
            ])
        )
            .filter(
                <T>(
                    p: PromiseSettledResult<T>
                ): p is PromiseFulfilledResult<T> => p.status === 'fulfilled'
            )
            .map((r) => r.value)
            .filter(<T>(result: Result<T, unknown>): result is ValueResult<T> =>
                Results.isOk(result)
            )
            .map((module) => module.aliases)

        if (message.content.startsWith(prefix)) {
            const result = await this.deps.commander.tryExecute(
                message.content.slice(prefix.length),
                {
                    aliasTrees,
                    commandManager: this.deps.commandManager,
                }
            )
            if (Results.isErr(result)) {
                const err = Array.isArray(result.error)
                    ? result.error[0]
                    : result.error
                let content: string = err.kind
                if (err.kind === 'command_failed') {
                    const [commandFailed, errorMessage, hint] =
                        await Promise.all([
                            LocalizationManager.lazy(
                                'interpreter',
                                'commander_command_failed',
                                undefined
                            ).resolve('pt_br', this.deps.localizationManager),
                            err.errorMessage.resolve(
                                'pt_br',
                                this.deps.localizationManager
                            ),
                            err.hint.resolve(
                                'pt_br',
                                this.deps.localizationManager
                            ),
                        ])
                    const title = commandFailed
                    const sourceLine = `--- ${err.line} | ${err.sourceLine}`
                    const hintLine = `${paddingFor(sourceLine, -2)}^^^^ ${hint}`
                    content = `\`\`\`diff\n${title}\n\n- ${errorMessage}\n\n${sourceLine}\n+${hintLine}\`\`\``
                }
                await message.reply({
                    content,
                })
                return
            }
            await message.reply({
                content: 'Success',
            })
            return
        }
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
