import { MusicManager } from './music_manager'

export class Guild {
    public music_manager: MusicManager
}

export class GuildManager {
    private guilds = new Map<string, Guild>()
}
