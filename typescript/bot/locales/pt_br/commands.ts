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
        music_play_user_not_in_voice_channel_description: `Para usar o comando play, você deve estar numa sala de voz.`,
        music_play_user_not_in_voice_channel_hint: `Entre numa sala de voz e chame o comando play novamente.`,
        command_not_dm_description: `Esse comando não pode ser usado em DMs.`,
        command_not_dm_hint: `Utilize esse comando num canal de texto de uma guilda.`,
    },
} satisfies LocaleSubmodule
