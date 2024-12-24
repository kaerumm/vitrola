import type { LocaleSubmodule } from '.'

export const commands = {
    kind: 'locale_submodule',
    definitions: {
        music_play_arguments_url_description:
            `A URL that points to a video/song or a search string` +
            ` that will be used to search youtube`,
        music_play_arguments_playlist_description:
            `If the url should be interpreted as a playlist` +
            `and should queue the videos of the playlist`,
    },
} satisfies LocaleSubmodule
