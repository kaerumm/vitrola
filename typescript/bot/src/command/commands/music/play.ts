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
                if (!context.message.guildId) {
                    return {
                        error: {
                            errorMessage: LocalizationManager.lazy(
                                'commands',
                                'command_not_dm_description',
                                undefined
                            ),
                            hint: LocalizationManager.lazy(
                                'commands',
                                'command_not_dm_hint',
                                undefined
                            ),
                        },
                    }
                }
                if (
                    !context.message.member ||
                    !context.message.member.voice.channelId
                ) {
                    return {
                        error: {
                            errorMessage: LocalizationManager.lazy(
                                'commands',
                                'music_play_user_not_in_voice_channel_description',
                                undefined
                            ),
                            hint: LocalizationManager.lazy(
                                'commands',
                                'music_play_user_not_in_voice_channel_hint',
                                undefined
                            ),
                        },
                    }
                }

                const guildId = context.message.guildId
                const voiceChannelId = context.message.member.voice.channelId

                if (args.playlist) {
                    console.log('Playlist')
                    for await (const videoData of self.deps.ytdl.search_playlist(
                        { url: args.url_or_search }
                    )) {
                    }
                } else {
                    console.log('Parse')
                    let search_result: Result<VideoData, PartialDSLError>
                    if (URL.canParse(args.url_or_search)) {
                        search_result = await self.deps.ytdl.search_info({
                            search_for: { url: args.url_or_search },
                        })
                    } else {
                        search_result = await self.deps.ytdl.search_info({
                            search_for: { string: args.url_or_search },
                        })
                    }
                    console.log(search_result)
                    if (Results.isErr(search_result)) {
                        return search_result
                    }
                }
                return Results.ok(ASTUnit)
            })
    }
}
