import { readableStreamToJSON, spawn } from 'bun'
import { Result, Results } from 'commons/lib/utils/result'
import { PartialDSLError } from '../command/commander'
import { LocalizationManager } from '../localization/localization_manager'
import { Logger } from 'commons/lib/log'

export interface VideoData {
    webpage_url: string
    title: string
    uploader: string
    duration: number
}

const print_fields = ['webpage_url', 'title', 'uploader', 'duration']
const print_string = `{${print_fields
            .map((k) => `"${k}": "%(${k})s"`)
            .join(',')}}`

function parse_video_data(raw_info: Record<string, any>): Result<VideoData, PartialDSLError> {
    const out_info: Partial<VideoData> = {}
    for (const key of print_fields) {
        if (!(key in raw_info) || raw_info[key] === 'NA') {
            out_info[key] = null
            continue
        }
        if (key === 'duration') {
            out_info[key] = Number.parseInt(raw_info[key])
            continue
        }
        out_info[key] = raw_info[key]
    }
    return out_info as VideoData
}


export class YoutubeDLP {
    constructor(private logger: Logger) {}

    async *search_playlist(args: {
        url: string
    }): AsyncGenerator<Result<VideoData, PartialDSLError>> {
        const process_arguments = [
            'youtube-dl',
            '--lazy-playlist',
            '--no-download',
            '--print',
        ]

        process_arguments.push(print_string)
        process_arguments.push(args.url)
        const { stdout } = spawn(process_arguments)
        let reader = stdout.getReader()
        try {
            const text_decoder = new TextDecoder()
            while (true) {
                let chunk = await reader.read()
                if (chunk.done) {
                    break
                }
                const raw_info = JSON.parse(text_decoder.decode(chunk.value))
                const out_info: Record<string, any> = {}
                for (const key of print_fields) {
                    if (!key)
                }
            }
            // const raw_info = await readableStreamToJSON(stdout)
            // const out_info: Record<string, any> = {}
            // for (const key of print_fields) {
            //     if (!(key in raw_info) || raw_info[key] === 'NA') {
            //         out_info[key] = null
            //         continue
            //     }
            //     if (key === 'playlist_index') {
            //         out_info[key] = Number.parseInt(raw_info[key])
            //         continue
            //     }
            //     out_info[key] = raw_info[key]
            // }
            // return out_info as PlaylistData
        } catch (error: unknown) {
            this.logger.error(`Error trying to fetch video data`, error)
            return {
                error: {
                    errorMessage: LocalizationManager.lazy(
                        'commands',
                        'ytdl_search_failed',
                        undefined
                    ),
                    hint: LocalizationManager.lazy(
                        'commands',
                        'ytdl_search_failed_hint',
                        undefined
                    ),
                },
            }
        }
    }

    async search_info(args: {
        search_for: { url: string } | { string: string }
    }): Promise<Result<VideoData, PartialDSLError>> {
        const process_arguments = [
            'youtube-dl',
            '--no-playlist',
            '--no-download',
            '--print',
        ]
        process_arguments.push(print_string)
        if ('string' in args.search_for) {
            process_arguments.push(`ytsearch:${args.search_for.string}`)
        } else {
            process_arguments.push(args.search_for.url)
        }
        const { stdout } = spawn(process_arguments)
        try {
            const raw_info = await readableStreamToJSON(stdout)

        } catch (error: unknown) {
            this.logger.error(`Error trying to fetch video data`, error)
            return {
                error: {
                    errorMessage: LocalizationManager.lazy(
                        'commands',
                        'ytdl_search_failed',
                        undefined
                    ),
                    hint: LocalizationManager.lazy(
                        'commands',
                        'ytdl_search_failed_hint',
                        undefined
                    ),
                },
            }
        }
    }
}
