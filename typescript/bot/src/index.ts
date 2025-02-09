import { BotInitializer } from './bot'
import { CommandManager } from './command/command_manager'
import { LocalizationManagerInitializer } from './localization/localization_manager'
import { ConsoleLogger } from 'commons/lib/log'
import { onProcessExit } from 'commons/lib/utils/exit'
import { Results } from 'commons/lib/utils/result'
import { AsyncDisposableStack } from 'commons/lib/utils/disposable'
import { ConfigurationManager } from './configuration/configuration_manager'
import { PingCommand } from './command/commands/ping'
import { Commander } from './command/commander'
import { PlayCommand } from './command/commands/music/play'
import { YoutubeDLP } from './modules/youtube_dlp'

const TOKEN_ENV_VAR = 'DISCORD_TOKEN'
const TOKEN_DEV_ENV_VAR = 'DISCORD_DEV_TOKEN'

const token =
    process.env[TOKEN_DEV_ENV_VAR] ?? process.env[TOKEN_ENV_VAR] ?? null

async function start() {
    await using disposeStack = new AsyncDisposableStack()
    const logger = new ConsoleLogger('Bot')
    if (!token) {
        logger.error(
            `Missing discord token, at least one of the following env vars '${TOKEN_DEV_ENV_VAR}' or '${TOKEN_ENV_VAR}' must be set`
        )
        process.exit(2)
    }

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

    const bot = await new BotInitializer().initialize(
        {
            logger: new ConsoleLogger('Bot'),
            localizationManager,
            commander: new Commander(),
            commandManager: new CommandManager({
                commands: [
                    new PingCommand({
                        logger: new ConsoleLogger('PingCommand'),
                    }),
                    new PlayCommand({
                        logger: new ConsoleLogger('PlayCommand'),
                        ytdl: new YoutubeDLP(new ConsoleLogger('YoutubeDLP')),
                    }),
                ],
            }),
            configurationManager: new ConfigurationManager(),
        },
        {
            token,
        }
    )
    if (Results.isErr(bot)) {
        logger.error(bot)
        process.exit(1)
    }
    disposeStack.use(bot)
    await onProcessExit()
    logger.info('Exiting the process')
    process.exit(1)
}

await start()
