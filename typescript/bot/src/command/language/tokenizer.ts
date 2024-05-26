import { Cursor } from 'commons/lib/data-structures/cursor'
import { Results, type Result } from 'commons/lib/utils/result'
import type { Option } from 'commons/lib/utils/option'
import {
    CharacterCodes,
    isSymbolAllowedInUnquotedString,
    isSpecialCharacter,
    isUnicodeLineBreak,
    isUnicodeWhitespace,
    isReservedCharacter,
} from './character'
import type { Span, Token, SyntaxError, UnfinishedString } from './tokens'
import { DSLError } from '../commander'
import { LocalizationManager } from '../../localization/localization_manager'
import { binarySearchClosest } from 'commons/lib/utils/array'
import { unreachable } from 'commons/lib/utils/error'

export class Tokenizer {
    static tokenize(
        source: string
    ): Result<
        { spans: Span<Token>[]; newlines: number[] },
        { errors: SyntaxError[]; newlines: number[] }
    > {
        const cursor = new Cursor<string>(source)
        const spans: Span[] = []
        const newlines: number[] = [0]
        const errors: SyntaxError[] = []
        let character: Option<string>
        while ((character = cursor.next())) {
            let token: Option<Result<Token, SyntaxError>> = null
            let position = cursor.position - 1
            switch (true) {
                case isSymbolAllowedInUnquotedString(character) &&
                    isEventuallyFollowedByUnicodeAlpha(cursor):
                    token = {
                        kind: 'string',
                        value: tokenizeUnquotedString(cursor, source, position),
                    }
                    break
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
                    newlines.push(position)
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
            spans.push({
                token,
                sourcePosition: [position, cursor.position],
            })
        }
        if (errors.length > 0) {
            return Results.error({ errors, newlines })
        }
        return { spans, newlines }
    }

    private static mapUnfinishedString(
        unfinishedString: UnfinishedString
    ): Pick<DSLError, 'errorMessage' | 'hint'> {
        return {
            errorMessage: LocalizationManager.lazy(
                'interpreter',
                'tokenizer_unfinished_string',
                undefined
            ),
            hint: LocalizationManager.lazy(
                'interpreter',
                'tokenizer_unfinished_string_hint',
                [unfinishedString.delimiter]
            ),
        }
    }

    static columnLineSourceForTokenRange(
        start: number,
        end: number,
        newlines: number[],
        source: string
    ): Pick<DSLError, 'column' | 'line' | 'sourceLine'> {
        const lineIndex =
            binarySearchClosest(newlines, start, 'low') ??
            unreachable('There should always be atleast one newline')
        return {
            line: lineIndex + 1,
            column: start - newlines[lineIndex] + 1,
            sourceLine: source.slice(newlines[lineIndex], end),
        }
    }

    static intoDSLError(
        source: string,
        error: SyntaxError,
        newlines: number[]
    ): DSLError {
        let partialDSLError: Pick<DSLError, 'errorMessage' | 'hint'>
        switch (error.kind) {
            case 'unfinished_string':
                partialDSLError = this.mapUnfinishedString(error)
                break
        }
        return {
            kind: 'command_failed',
            ...this.columnLineSourceForTokenRange(
                error.range[0],
                error.range[1],
                newlines,
                source
            ),
            ...partialDSLError,
        }
    }

    static tokenIntoString(token: Token): string {
        switch (token.kind) {
            case 'string':
                return token.value
            case 'left_paren':
                return '('
            case 'right_paren':
                return ')'
            case 'minus':
                return '-'
            case 'plus':
                return '+'
            case 'semicolon':
                return ';'
            case 'forward_slash':
                return '/'
            case 'star':
                return '*'
            case 'bang':
                return '!'
            case 'bang_equal':
                return '!='
            case 'equal':
                return '='
            case 'equal_equal':
                return '=='
            case 'greater':
                return '>'
            case 'greater_equal':
                return '>='
            case 'less':
                return '<'
            case 'less_equal':
                return '<='
            case 'pipe':
                return '|'
            case 'and':
                return '&&'
            case 'or':
                return '||'
            case 'invalid_token':
                return '<?invalid_token?>'
        }
    }

    static pairFor(token: Token): Token {
        switch (token.kind) {
            case 'left_paren':
                return { kind: 'right_paren' }
            case 'right_paren':
                return { kind: 'left_paren' }
            case 'invalid_token':
            case 'string':
            case 'minus':
            case 'plus':
            case 'semicolon':
            case 'forward_slash':
            case 'star':
            case 'bang':
            case 'bang_equal':
            case 'equal':
            case 'equal_equal':
            case 'greater':
            case 'greater_equal':
            case 'less':
            case 'less_equal':
            case 'pipe':
            case 'and':
            case 'or':
                return { kind: 'invalid_token' }
        }
    }

    // Utility function for testing, should maybe be moved from here
    static tokenizeOrUnreachable(source: string): {
        spans: Span<Token>[]
        newlines: number[]
    } {
        return Results.mapOrElse(Tokenizer.tokenize(source), () =>
            unreachable(
                'This function should only be called when it is guaranteed the tokenization will not fail'
            )
        )
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
        if (
            !isSymbolAllowedInUnquotedString(cursor.peek(0)) &&
            isSpecialCharacter(cursor.peek(0))
        ) {
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
    delimiterPosition: number
): Result<string, UnfinishedString> {
    let next
    let firstCharacterPosition = delimiterPosition + 1
    let lastCharacterPosition = firstCharacterPosition
    do {
        lastCharacterPosition = cursor.position
        next = cursor.next()
        if (!next) {
            return {
                error: {
                    kind: 'unfinished_string',
                    range: [firstCharacterPosition - 1, lastCharacterPosition],
                    delimiter,
                },
            }
        }
    } while (next !== delimiter)
    return source.slice(firstCharacterPosition, lastCharacterPosition)
}

function isEventuallyFollowedByUnicodeAlpha(cursor: Cursor<string>): boolean {
    let offset = 0
    let next
    while ((next = cursor.peek(offset))) {
        offset += 1
        if (isSpecialCharacter(next)) {
            if (isSymbolAllowedInUnquotedString(next)) {
                continue
            }
            return false
        }
        return true
    }
    return false
}
