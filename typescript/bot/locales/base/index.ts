import { interpreter } from './interpreter'
import { alias_tree } from './alias_tree'

export const modules = {
    interpreter,
    alias_tree,
} satisfies LocaleModule

export type CommandAliasNode = Required<Pick<AliasNode, 'commandIdentifier'>> &
    AliasNode

export interface AliasNode {
    commandIdentifier?: string
    children?: Record<string, AliasNode>
}

export type AliasTree = Record<string, AliasNode>

/**
 * A localization resource to define command aliases, this allows the locale en_us to point the string 'play' to the command named 'play'
 * While pt_br points 'tocar' to 'play'
 */
export type AliasTreeModule = {
    kind: 'alias_tree'
    aliases: AliasTree
}

export type LocaleEntry<Args extends any[]> =
    | string
    | ((...args: Args) => string)

export interface LocaleSubmodule {
    kind: 'locale_submodule'
    definitions: {
        [key: string]: LocaleEntry<any>
    }
}

export type LocaleModule = {
    [key: string]: AliasTreeModule | LocaleSubmodule
}
