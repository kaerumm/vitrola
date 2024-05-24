export type Nullable<T> = T | null

export type Expect<T extends true> = T
export type ExpectFalse<T extends false> = T

export type Equal<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
        ? true
        : false
export type NotEqual<X, Y> = true extends Equal<X, Y> ? false : true

// https://stackoverflow.com/questions/49927523/disallow-call-with-any/49928360#49928360
export type IsAny<T> = 0 extends 1 & T ? true : false
export type NotAny<T> = true extends IsAny<T> ? false : true

export type Debug<T> = { [K in keyof T]: T[K] }
export type MergeInsertions<T> = T extends object
    ? { [K in keyof T]: MergeInsertions<T[K]> }
    : T

export type Alike<X, Y> = Equal<MergeInsertions<X>, MergeInsertions<Y>>
export type ExpectExtends<Value, Expected> = Expected extends Value
    ? true
    : false
export type ExpectValidArgs<
    Func extends (...args: any[]) => any,
    Args extends any[],
> = Args extends Parameters<Func> ? true : false
export type UnionToIntersection<U> = (
    U extends any ? (k: U) => void : never
) extends (k: infer I) => void
    ? I
    : never

export type Split<
    Value extends string,
    Separator extends string = '.',
> = Value extends `${infer Left}${Separator}${infer Right}`
    ? [Left, ...Split<Right, Separator>]
    : [Value]

type SplitTest = [
    Expect<Equal<Split<'a.b.c', '.'>, ['a', 'b', 'c']>>,
    Expect<Equal<Split<'a,b,c', ','>, ['a', 'b', 'c']>>,
]

export type Reverse<Value extends any[]> = Value extends [
    ...infer Rest,
    infer Last,
]
    ? [Last, ...Reverse<Rest>]
    : Value

type ReverseTest = [Expect<Equal<Reverse<[1, 2, 3]>, [3, 2, 1]>>]

/**
 *
 * Erases the type if it is an object and it is a function, a symbol or an array
 * This can be used when you want only map/dictionary objects
 */
export type MapObject<O> = O extends object
    ? O extends Function
        ? never
        : O extends Symbol
          ? never
          : O extends Array<any>
            ? never
            : O
    : never

export type ArgumentsOf<T> = T extends (...args: infer Arguments) => any
    ? Arguments
    : undefined

type ArgumentsOfTest = [
    Expect<
        Equal<
            ArgumentsOf<
                (
                    a: number,
                    b: boolean,
                    c: 'string',
                    d: 0,
                    e: [0, boolean, { a: 0; b: boolean }],
                    f: { a: 0; b: boolean }
                ) => void
            >,
            [
                number,
                boolean,
                'string',
                0,
                [0, boolean, { a: 0; b: boolean }],
                { a: 0; b: boolean },
            ]
        >
    >,
    Expect<Equal<ArgumentsOf<string>, undefined>>,
]

/**
 *
 * Matches U or some narrower value of U
 *
 * For instance if U is number, matches number or any specific number like 0, 1, etc...
 */
export type KeysMatchingSubtype<T extends object, U> = {
    [Key in keyof T]-?: T[Key] extends U ? Key : never
}[keyof T]

type KeysMatchingSubtypeTest = [
    Expect<
        Equal<
            KeysMatchingSubtype<
                { narrow: 0; exact: number; wide: number | string },
                number
            >,
            'narrow' | 'exact'
        >
    >,
]

/**
 *
 * Matches U or some narrower value of U
 *
 * For instance if U is number, matches number or any specific number like 0, 1, etc...
 */
export type KeysMatchingExactType<T extends object, U> = {
    [Key in keyof T]-?: T[Key] extends U
        ? [U] extends [T[Key]]
            ? Key
            : never
        : never
}[keyof T]

type KeysMatchingExactTypeTest = [
    Expect<
        Equal<
            KeysMatchingExactType<
                { narrow: 0; exact: number; wide: number | string },
                number
            >,
            'exact'
        >
    >,
]

/**
 *
 * Matches U or some union of U
 *
 */
export type KeysMatchingSupertype<T extends object, U> = {
    [Key in keyof T]-?: [U] extends [T[Key]] ? Key : never
}[keyof T]

type KeysMatchingSupertypeTest = [
    Expect<
        Equal<
            KeysMatchingSupertype<
                { narrow: 0; exact: number; wide: number | string },
                number
            >,
            'exact' | 'wide'
        >
    >,
]

// not used
type ExtendsStrict<T, U> = T extends U ? ([U] extends [T] ? T : never) : never

export interface Constructor<T, Args extends any[] = []> {
    new (...args: Args): T
}

export type Join<
    Array extends string[],
    Separator extends string,
> = Array extends [infer First extends string, ...infer Rest extends string[]]
    ? Rest['length'] extends 0
        ? `${First}`
        : `${First}${Separator}${Join<Rest, Separator>}`
    : never

type JoinTest = [
    Expect<Equal<Join<['a', 'b'], '.'>, 'a.b'>>,
    Expect<Equal<Join<['a'], '.'>, 'a'>>,
]
