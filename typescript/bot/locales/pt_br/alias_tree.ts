import type { AliasTreeModule } from '../base'

export const alias_tree = {
    kind: 'alias_tree',
    aliases: {
        children: {
            tocar: {
                commandIdentifier: 'music_play',
            },
        },
    },
} satisfies AliasTreeModule
