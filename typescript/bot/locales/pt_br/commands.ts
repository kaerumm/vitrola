import { LocaleSubmodule } from '../base'

export const commands = {
    kind: 'locale_submodule',
    definitions: {
        music_play_arguments_url_description:
            `Uma URL que aponta para um video/musica ou uma busca` +
            ` que sera feita atraves do youtube`,
        music_play_arguments_playlist_description:
            `Se além de adicionar o vídeo, se deve processar a url como playlist` +
            `e adicionar os vídeos da playlist na lista de músicas`,
        ytdl_search_failed: `Não foi possível obter as informações do vídeo pedido.`,
        ytdl_search_failed_hint: `Notifique Kaerum`,
    },
} satisfies LocaleSubmodule
