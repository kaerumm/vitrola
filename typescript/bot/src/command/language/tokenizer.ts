import { Cursor } from 'commons/lib/data-structures/cursor'
import { Results, type Result } from 'commons/lib/utils/result'
import type { Option } from 'commons/lib/utils/option'
import {
    CharacterCodes,
    isSpecialCharacter,
    isUnicodeLineBreak,
    isUnicodeWhitespace,
} from './character'
import type { Span, Token, SyntaxError } from './tokens'

export class Tokenizer {
    static tokenize(source: string): Result<Span<Token>[], SyntaxError[]> {
        const cursor = new Cursor<string>(source)
        const spans: Span<Token>[] = []
        const errors: SyntaxError[] = []
        let character: Option<string>
        while ((character = cursor.next())) {
            let token: Option<Result<Token, SyntaxError>> = null
            let position = cursor.position - 1
            switch (true) {
                case character === '(':
                    token = { kind: 'left_paren' }
                    break
                case character === ')':
                    token = { kind: 'right_paren' }
                    break
                case character === '-':
                    token = { kind: 'minus' }
                    break
                case character === '+':
                    token = { kind: 'plus' }
                    break
                case character === ';':
                    token = { kind: 'semicolon' }
                    break
                case character === '/':
                    token = { kind: 'forward_slash' }
                    break
                case character === '*':
                    token = { kind: 'star' }
                    break
                case character === '!':
                    if (cursor.peek(0) === '=') {
                        cursor.next()
                        token = { kind: 'bang_equal' }
                        break
                    }
                    token = { kind: 'bang' }
                    break
                case character === '=':
                    if (cursor.peek(0) === '=') {
                        cursor.next()
                        token = { kind: 'equal_equal' }
                        break
                    }
                    token = { kind: 'equal' }
                    break
                case character === '>':
                    if (cursor.peek(0) === '=') {
                        cursor.next()
                        token = { kind: 'greater_equal' }
                        break
                    }
                    token = { kind: 'greater' }
                    break
                case character === '<':
                    if (cursor.peek(0) === '=') {
                        cursor.next()
                        token = { kind: 'less_equal' }
                        break
                    }
                    token = { kind: 'less' }
                    break
                case character === '&':
                    if (cursor.peek(0) === '&') {
                        cursor.next()
                        token = { kind: 'and' }
                        break
                    }
                    // TODO: Background running support(?) does that even make sense for our context?
                    break
                case character === '|':
                    if (cursor.peek(0) === '|') {
                        cursor.next()
                        token = { kind: 'or' }
                        break
                    }
                    token = { kind: 'pipe' }
                    break
                case character === "'" || character === '"':
                    token = Results.map(
                        tokenizeString(character, cursor, source, position),
                        (value) => ({
                            kind: 'string',
                            value,
                        })
                    )
                    break
                case isUnicodeWhitespace(character):
                    // Ignore the input
                    break
                case isUnicodeLineBreak(character):
                    consumeLineTerminator(character as string, cursor)
                    token = {
                        kind: 'semicolon',
                    }
                    break
                case !isSpecialCharacter(character):
                    token = {
                        kind: 'string',
                        value: tokenizeUnquotedString(cursor, source, position),
                    }
                    break
                default:
                    // Ignore the input
                    break
            }
            if (!token) {
                continue
            }
            if (Results.isErr(token)) {
                errors.push(token.error)
                continue
            }
            spans.push({ token, position })
        }
        if (errors.length > 0) {
            return { error: errors }
        }
        return spans
    }
}

export function consumeLineTerminator(
    firstTerminator: string,
    cursor: Cursor<string>
): void {
    if (
        firstTerminator.codePointAt(0)! === CharacterCodes.CarriageReturn &&
        cursor.peek(0)?.codePointAt(0)! === CharacterCodes.LineFeed
    ) {
        cursor.next()
    }
}

export function tokenizeUnquotedString(
    cursor: Cursor<string>,
    source: string,
    firstCharacterPosition: number
): string {
    let lastCharacterPosition = firstCharacterPosition
    let next
    do {
        lastCharacterPosition = cursor.position
        if (isSpecialCharacter(cursor.peek(0))) {
            break
        }
        next = cursor.next()
    } while (next)
    return source.slice(firstCharacterPosition, lastCharacterPosition)
}

export function tokenizeString(
    delimiter: "'" | '"',
    cursor: Cursor<string>,
    source: string,
    delimiterPosition: number,
    ignoreError = false
): Result<string, SyntaxError> {
    let next
    let firstCharacterPosition = delimiterPosition + 1
    let lastCharacterPosition = firstCharacterPosition
    do {
        lastCharacterPosition = cursor.position
        next = cursor.next()
        if (!next) {
            if (ignoreError) {
                break
            }
            return {
                error: {
                    kind: 'unfinished_string',
                    position: delimiterPosition,
                },
            }
        }
    } while (next !== delimiter)
    return source.slice(firstCharacterPosition, lastCharacterPosition)
}
