import type { Equal, Expect, MapObject, Reverse, Split } from './utils'

type Node<
    K extends string | number,
    IsRoot extends boolean,
> = IsRoot extends true ? `${K}` : `.${K}`
/**
 * Turns object types into a union of all the possible key paths for that object
 *
 * This utility type recurses into Arrays and Map/Dictionary Objects.
 *
 * - Arrays -> Only returns the paths for the array's indexes, does not return array methods
 * - Map/Dictionary objects -> Returns every possible key
 *
 * const object = {
 *  array: [1],
 *  function: () => 'a',
 *  number: 8
 * } as const
 *
 * declare const keyPaths: ObjectKeyPaths<typeof object>
 * // ^? -> 'array.0' | 'number' | 'function'
 */
export type ObjectKeyPaths<
    T extends object,
    IsRoot extends boolean = true,
    K extends Exclude<keyof T, keyof []> = Exclude<keyof T, keyof []>,
> = K extends string
    ?
          | Node<T[K] extends MapObject<T[K]> | Array<any> ? never : K, IsRoot>
          | (K extends keyof T
                ? T[K] extends MapObject<T[K]> | Array<any>
                    ? `${Node<K, IsRoot>}${ObjectKeyPaths<T[K], false>}`
                    : never
                : never)
    : never

type FollowTrails<T extends object, Key extends string[]> = Key extends [
    infer K extends keyof T,
]
    ? T[K]
    : Key extends [...infer Rest extends string[], infer K extends keyof T]
      ? T[K] extends object
          ? FollowTrails<T[K], Rest>
          : never
      : never

type ObjectKeyPathsTest = [
    // Field at root
    // boolean
    Expect<Equal<ObjectKeyPaths<{ root: boolean }>, 'root'>>,
    // string
    Expect<Equal<ObjectKeyPaths<{ root: string }>, 'root'>>,
    // number
    Expect<Equal<ObjectKeyPaths<{ root: number }>, 'root'>>,
    // bigint
    Expect<Equal<ObjectKeyPaths<{ root: bigint }>, 'root'>>,
    // symbol
    Expect<Equal<ObjectKeyPaths<{ root: Symbol }>, 'root'>>,
    // null
    Expect<Equal<ObjectKeyPaths<{ root: null }>, 'root'>>,
    // undefined
    Expect<Equal<ObjectKeyPaths<{ root: undefined }>, 'root'>>,
    // function
    Expect<Equal<ObjectKeyPaths<{ root: () => 'root' }>, 'root'>>,
    // Nested array
    Expect<
        Equal<ObjectKeyPaths<{ array: [true, true] }>, 'array.0' | 'array.1'>
    >,
    // Nested object
    Expect<Equal<ObjectKeyPaths<{ object: { field: true } }>, 'object.field'>>,
    // Deeply nested object
    Expect<
        Equal<
            ObjectKeyPaths<{
                object: { object: { field: true } }
                array: [{ field: true }]
            }>,
            'object.object.field' | 'array.0.field'
        >
    >,
    // Deeply nested array
    Expect<
        Equal<
            ObjectKeyPaths<{ object: { array: [true] }; array: [[true]] }>,
            'object.array.0' | 'array.0.0'
        >
    >,
]

/**
 * Follows a path for an object type, returning the type that is at the end of the path
 */
export type FollowPath<
    T extends object,
    Key extends ObjectKeyPaths<T>,
> = FollowTrails<T, Reverse<Split<Key>>>

type FollowPathTest = [
    // Field at root
    Expect<Equal<FollowPath<{ root: true }, 'root'>, true>>,
    // Nested array
    Expect<Equal<FollowPath<{ array: [true, false] }, 'array.0'>, true>>,
    // Nested object
    Expect<
        Equal<FollowPath<{ object: { field: true } }, 'object.field'>, true>
    >,
    // Deeply nested object
    Expect<
        Equal<
            FollowPath<
                {
                    object: { object: { field: true } }
                    array: [{ field: false }]
                },
                'object.object.field'
            >,
            true
        >
    >,
    // Deeply nested array
    Expect<
        Equal<
            FollowPath<
                { object: { array: [true] }; array: [[false]] },
                'object.array.0'
            >,
            true
        >
    >,
]
