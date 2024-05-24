import type { FollowPath, ObjectKeyPaths } from '../types/objects'
import type { Join } from '../types/utils'
import type { Option } from '../utils/option.ts'

export function tryFollow<
    Object extends Record<string, any>,
    Path extends string[],
>(
    object: Object,
    path: Path
): Option<
    Join<Path, '.'> extends ObjectKeyPaths<Object>
        ? FollowPath<Object, ObjectKeyPaths<Object>>
        : unknown
> {
    let value = object
    for (const trail of path) {
        if (!(trail in value)) {
            return null
        }
        value = value[trail]
    }
    // @ts-ignore
    return value as unknown as ReturnType<typeof tryFollow>
}
