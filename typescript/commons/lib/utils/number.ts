import { Result, Results } from './result'

export interface NotANumber {
    kind: 'not_a_number'
}

export interface Unknown {
    kind: 'unknown'
    error: unknown
}

export type ParseIntegerError = NotANumber | Unknown

export function parseInteger(
    str: string,
    base: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 16
): Result<number, ParseIntegerError> {
    try {
        const value = parseInt(str, base)
        if (isNaN(value)) {
            return Results.error({
                kind: 'not_a_number',
            })
        }
        return parseInt(str, base)
    } catch (error: unknown) {
        return Results.error({ kind: 'unknown', error })
    }
}
