import type { interpreter } from './interpreter'
import type { alias_tree } from './alias_tree'
import type { modules as baseModules } from '../base/index'

export const modules = {
    interpreter,
    alias_tree,
    commands,
} satisfies typeof baseModules
