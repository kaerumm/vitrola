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
        const self = this
        return CommandBuilder.new('music_play')
            .positional({
                name: 'url_or_search',
                description: LocalizationManager.lazy(
                    'commands',
                    'music_play_arguments_url_description',
                    undefined
                ),
                parser: new StringParser(),
                optional: false,
            })
            .flag({
                name: 'playlist',
                description: LocalizationManager.lazy(
                    'commands',
                    'music_play_arguments_playlist_description',
                    undefined
                ),
            })
            .build(async function execute(args, context) {
                if (URL.canParse(args.url_or_search[0])) {
                }
                return Results.ok(ASTUnit)
            })
    }
}
