import { readableStreamToJSON, spawn } from 'bun'
import { Result } from 'commons/lib/utils/result'
import { PartialDSLError } from '../command/commander'
import { LocalizationManager } from '../localization/localization_manager'
import { Logger } from 'commons/lib/log'

export interface VideoData {
    url: string | null
    title: string | null
    uploader: string | null
    duration: number | null
    playlist?: {
        id: string | null
        index: number | null
        title: string | null
    }
}

export class YoutubeDLP {
    constructor(private logger: Logger) {}
    // static async search_direct(search_string: string): Promise<Result<void>> {
    //     return execute([`ytsearch:${search_string}`])
    // }

    async search_info(args: {
        search_for: { url: string } | { string: string }
        playlist: boolean
    }): Promise<Result<VideoData, PartialDSLError>> {
        const process_arguments = ['youtube-dl', '--no-download', '--print']
        const print_fields = ['url', 'title', 'uploader', 'duration']
        if (args.playlist) {
            print_fields.push('playlist_id')
            print_fields.push('playlist_index')
            print_fields.push('playlist_title')
        }
        const print_string = `{${print_fields
            .map((k) => `"${k}": "%(${k})s"`)
            .join(',')}}`
        process_arguments.push(print_string)
        if ('string' in args.search_for) {
            process_arguments.push(`ytsearch:${args.search_for.string}`)
        } else {
            process_arguments.push(args.search_for.url)
        }
        const { stdout } = spawn(process_arguments)
        try {
            const raw_info = await readableStreamToJSON(stdout)
            const out_info: Record<string, any> = {}
            for (const key of print_fields) {
                if (!(key in raw_info) || raw_info[key] === 'NA') {
                    out_info[key] = null
                    continue
                }
                if (key === 'duration' || key === 'playlist_index') {
                    out_info[key] = Number.parseInt(raw_info[key])
                    continue
                }
                out_info[key] = raw_info[key]
            }
            return out_info as VideoData
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
