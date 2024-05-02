import { BotInitializer } from './bot'
import { CommandManager } from './command/command_manager'
import { LocalizationManagerInitializer } from './localization/localization_manager'
import { ConsoleLogger } from 'commons/lib/log'
import { onProcessExit } from 'commons/lib/utils/exit'
import { Results } from 'commons/lib/utils/result'
import { AsyncDisposableStack } from 'commons/lib/utils/disposable'

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

    const bot = await new BotInitializer().initialize(
        {
            logger: new ConsoleLogger('Bot'),
            localizationManager,
            commandManager: new CommandManager({}, { commands: [] }),
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
    console.log('Exit')
    process.exit(1)
}

await start()
