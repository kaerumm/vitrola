import type { AliasTreeModule } from '.'

export const alias_tree = {
    kind: 'alias_tree',
    aliases: {
        ping: {
            commandIdentifier: 'ping',
            children: {},
        },
        music: {
            children: {
                play: { commandIdentifier: 'music_play' },
            },
        },
        play: {
            commandIdentifier: 'music_play',
        },
        p: {
            commandIdentifier: 'music_play',
        },
        ply: {
            commandIdentifier: 'music_play',
        },
    },
} satisfies AliasTreeModule
