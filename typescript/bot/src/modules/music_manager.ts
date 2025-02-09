import { GenericCache } from 'commons/lib/data-structures/cache'
import { VideoData } from './youtube_dlp'
import { AudioResource } from '@discordjs/voice'
import { minutes } from 'commons/lib/utils/time'

export interface QueuedMusic {
    url: string
    title: string
    duration: number
    uploader: string
    voiceChannelId: string
}

export interface MusicQueue {
    push(videoData: VideoData, voiceChannelId: string): Promise<void>
    next(): Promise<QueuedMusic>
    peek(offset: number): Promise<QueuedMusic>
}

export class MusicManager {
    private audioResourceCache: GenericCache<AudioResource<QueuedMusic>> =
        new GenericCache({ ttl: minutes(30) })

    constructor(private deps: { queue: MusicQueue }) {}

    skipMusic() {}

    pushMusic(videoData: VideoData, voiceChannelId: string) {
        return this.deps.queue.push(videoData, voiceChannelId)
    }
}
