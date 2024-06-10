import { Result, Results } from '../utils/result.ts'
import { Cursor } from '../data-structures/cursor.ts'
import { Option } from '../utils/option.ts'
import {
    isDigit,
    isUnicodeLineBreak,
    isUnicodeWhitespace,
} from '../utils/character.ts'
import { parseInteger } from '../utils/number.ts'
import { isAllowedToStartCronKeyword } from './character.ts'
import { unreachable } from '../utils/error.ts'

const months = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
] as const
const daysOfWeek = [
    'sun',
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
    'SUN',
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT',
] as const
const special = ['@reboot'] as const

export const keywords = [...months, ...daysOfWeek, ...special] as const
const keywordSet = new Set<string>(keywords)

export interface Star {
    kind: 'star'
}

export interface ForwardSlash {
    kind: 'forward_slash'
}

export interface Number {
    kind: 'number'
    value: number
}

export interface Comma {
    kind: 'comma'
}

export interface Dash {
    kind: 'dash'
}

export interface Keyword {
    kind: 'keyword'
    key: (typeof keywords)[number]
}

export type Token = Star | ForwardSlash | Number | Comma | Dash | Keyword

export interface UnexpectedToken {
    kind: 'unexpected_token'
    character: string
}

export interface InvalidNumber {
    kind: 'invalid_number'
    source: string
}

export interface UnknownKeyword {
    kind: 'unknown_keyword'
    word: string
}
export type CrontabTokenizationError =
    | UnexpectedToken
    | InvalidNumber
    | UnknownKeyword

export class Tokenizer {
    static tokenize(source: string): Result<Token[], CrontabTokenizationError> {
        const cursor = new Cursor<string>(source)
        const tokens: Token[] = []
        let character: Option<string>
        while ((character = cursor.next())) {
            let token: Option<Result<Token, CrontabTokenizationError>> = null
            let position = cursor.position - 1
            switch (true) {
                case isAllowedToStartCronKeyword(character):
                    token = this.parseCronKeyword(position, cursor, source)
                    break
                case isDigit(character):
                    token = this.parsePositiveInteger(position, cursor, source)
                    break
                case character === '*':
                    token = { kind: 'star' }
                    break
                case character === '/':
                    token = { kind: 'forward_slash' }
                    break
                case character === ',':
                    token = { kind: 'comma' }
                    break
                case character === '-':
                    token = { kind: 'dash' }
                    break
                case isUnicodeWhitespace(character):
                    break
                case isUnicodeLineBreak(character):
                    return tokens
            }
            if (!token) {
                continue
            }
            if (Results.isErr(token)) {
                return token
            }
            tokens.push(token)
        }
        return tokens
    }

    static parseCronKeyword(
        firstCharacterPosition: number,
        cursor: Cursor<string>,
        source: string
    ): Result<Keyword, CrontabTokenizationError> {
        let next: Option<string>
        while ((next = cursor.next())) {
            if (!isAllowedToStartCronKeyword(next)) {
                break
            }
        }
        let str = source.slice(firstCharacterPosition, cursor.position)
        if (!isKeyword(str)) {
            return Results.error({ kind: 'unknown_keyword', word: str })
        }
        return { kind: 'keyword', key: str }
    }

    static parsePositiveInteger(
        firstDigitPosition: number,
        cursor: Cursor<string>,
        source: string
    ): Result<Number, CrontabTokenizationError> {
        let next: Option<string>
        while ((next = cursor.next())) {
            if (
                !next ||
                isUnicodeWhitespace(next) ||
                isUnicodeLineBreak(next)
            ) {
                break
            }
            if (!isDigit(next)) {
                return Results.error({
                    kind: 'unexpected_token',
                    character: next,
                })
            }
        }
        return Results.map(
            Results.mapError(
                parseInteger(
                    source.slice(firstDigitPosition, cursor.position),
                    10
                ),
                () => ({
                    kind: 'invalid_number',
                    source: source.slice(firstDigitPosition, cursor.position),
                })
            ),
            (value) => ({
                kind: 'number',
                value,
            })
        )
    }

    static tokenizeOrUnreachable(source: string): Token[] {
        return Results.mapOrElse(Tokenizer.tokenize(source), () =>
            unreachable(
                'This function should only be called if the tokenization is not guaranteed to fail'
            )
        )
    }
}

function isKeyword(key: string): key is (typeof keywords)[number] {
    return keywordSet.has(key)
}
