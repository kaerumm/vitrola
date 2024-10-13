import { Results } from 'commons/lib/utils/result'
import type { Command } from '../../command'
import { CommandBuilder } from '../../command_builder'
import { ASTUnit } from '../../language/ast'
import { StringParser } from '../../parsers/string'
import { Logger } from 'commons/lib/log.ts'
import { LocalizationManager } from '../../../localization/localization_manager'

export class PlayCommand implements Command {
    constructor(private deps: { logger: Logger }) {}
    buildDefinition() {
        const deps = this.deps
        return CommandBuilder.new('music_play')
            .positional({
                name: 'url_or_search',
                // fix this later
                description: LocalizationManager.lazy(
                    'commands',
                    'music_play_arguments_url_description',
                    undefined
                ),
                parser: new StringParser(),
                optional: false,
            })
            .build(async function execute(args, _) {
                deps.logger.info(`URL or search: "${args.url_or_search}"`)
                return Results.ok(ASTUnit)
            })
    }
}
