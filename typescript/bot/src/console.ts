import { BotInitializer } from './bot'
import { CommandManager } from './command/command_manager'
import {
    LocalizationManager,
    LocalizationManagerInitializer,
} from './localization/localization_manager'
import { ConsoleLogger, Logger } from 'commons/lib/log'
import { onProcessExit } from 'commons/lib/utils/exit'
import { Result, Results, ValueResult } from 'commons/lib/utils/result'
import { AsyncDisposableStack } from 'commons/lib/utils/disposable'
import { ConfigurationManager } from './configuration/configuration_manager'
import { PingCommand } from './command/commands/ping'
import { Commander } from './command/commander'
import { AsyncInitializer } from './types/initialization'
import { Message, MessagePayload } from 'discord.js'
import { paddingFor } from 'commons/lib/utils/string'
import { PlayCommand } from './command/commands/music/play'
import { generateDependencyReport } from '@discordjs/voice'

async function start() {
    await using disposeStack = new AsyncDisposableStack()
    const logger = new ConsoleLogger('Console')

    logger.info(generateDependencyReport())
    const localizationManager =
        await new LocalizationManagerInitializer().initialize({
            logger: new ConsoleLogger('LocalizationManager'),
        })

    if (Results.isErr(localizationManager)) {
        logger.error(localizationManager.error)
        process.exit(1)
    }

    const defaultAliasTree = await localizationManager.getSubmodule(
        'en_us',
        'alias_tree'
    )
    if (Results.isErr(defaultAliasTree)) {
        logger.error(defaultAliasTree)
        process.exit(1)
    }

    const console = await new ConsoleInitializer().initialize({
        logger: new ConsoleLogger('Console'),
        localizationManager,
        commander: new Commander(),
        commandManager: new CommandManager({
            commands: [
                new PingCommand({ logger: new ConsoleLogger('PingCommand') }),
                new PlayCommand({ logger: new ConsoleLogger('PlayCommand') }),
            ],
        }),
        configurationManager: new ConfigurationManager(),
    })
    if (Results.isErr(console)) {
        logger.error(console)
        process.exit(1)
    }
    disposeStack.use(console)
    process.stdin.setEncoding('utf8').on('data', (data: string) => {
        console.onMessage({
            content: data,
            guildId: 'test',
            reply: (option) => {
                if (typeof option === 'string') {
                    logger.info(`Reply :\n`, option)
                } else if (option instanceof MessagePayload) {
                } else {
                    if (option.content) {
                        logger.info(`Reply:\n`, option.content)
                    }
                }
            },
        } as Message<boolean>)
    })
    await onProcessExit()
    logger.info('Exiting the process')
    process.exit(1)
}

export class ConsoleInitializer implements AsyncInitializer<Console, unknown> {
    async initialize(
        deps: Omit<Console['deps'], 'discordClient'>
    ): Promise<Result<Console, unknown>> {
        return new Console(deps)
    }
}

export class Console {
    constructor(
        private deps: {
            logger: Logger
            commander: Commander
            commandManager: CommandManager
            localizationManager: LocalizationManager
            configurationManager: ConfigurationManager
        }
    ) {
        this.deps.logger.info('Initialization complete')
    }

    async [Symbol.asyncDispose]() {}

    async onMessage(message: Message<boolean>): Promise<void> {
        try {
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
                    ): p is PromiseFulfilledResult<T> =>
                        p.status === 'fulfilled'
                )
                .map((r) => r.value)
                .filter(
                    <T>(result: Result<T, unknown>): result is ValueResult<T> =>
                        Results.isOk(result)
                )
                .map((module) => module.aliases)

            if (message.content.startsWith(prefix)) {
                const result = await this.deps.commander.tryExecute(
                    message.content.slice(prefix.length),
                    {
                        aliasTrees,
                        commandManager: this.deps.commandManager,
                        message,
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
                                ).resolve(
                                    'en_us',
                                    this.deps.localizationManager
                                ),
                                err.errorMessage.resolve(
                                    'en_us',
                                    this.deps.localizationManager
                                ),
                                err.hint.resolve(
                                    'en_us',
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
        } catch (err: unknown) {
            this.deps.logger.error('Error: ', err)
        }
    }
}

await start()
