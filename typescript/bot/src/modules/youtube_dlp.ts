import * as cp from 'child_process'
import { Result } from 'commons/lib/utils/result'

function execute(args: string[]): Promise<Result<void>> {
    return new Promise(function (resolve, reject) {
        const process = cp.spawn('youtube-dl', args, {
            stdio: ['ignore', 'pipe', 'pipe'],
        })
    })
}

export class YoutubeDLP {
    static async search(search_string: string): Promise<Result<void>> {
        return execute([`ytsearch:${search_string}`])
    }
    static async from_url(url: URL, playlist: boolean): Promise<void> {}
}
