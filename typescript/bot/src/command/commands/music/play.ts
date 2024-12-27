import { Result, Results } from 'commons/lib/utils/result'
import type { Command } from '../../command'
import { CommandBuilder } from '../../command_builder'
import { ASTUnit } from '../../language/ast'
import { StringParser } from '../../parsers/string'
import { Logger } from 'commons/lib/log.ts'
import { LocalizationManager } from '../../../localization/localization_manager'
import { VideoData, YoutubeDLP } from '../../../modules/youtube_dlp'
import { PartialDSLError } from '../../commander'

export class PlayCommand implements Command {
    constructor(private deps: { logger: Logger; ytdl: YoutubeDLP }) {}
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
                // Search results does not return URL when searching by string
                let search_result: Result<VideoData, PartialDSLError>
                if (URL.canParse(args.url_or_search)) {
                    search_result = await self.deps.ytdl.search_info({
                        search_for: { url: args.url_or_search },
                        playlist: args.playlist ?? false,
                    })
                } else {
                    search_result = await self.deps.ytdl.search_info({
                        search_for: { string: args.url_or_search },
                        playlist: args.playlist ?? false,
                    })
                }
                if (Results.isErr(search_result)) {
                    return search_result
                }
                return Results.ok(ASTUnit)
            })
    }
}
