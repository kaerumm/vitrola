import { describe, test, expect } from '@jest/globals'
import { Tokenizer, isEventuallyFollowedByUnicodeAlpha } from './tokenizer'
import * as fs from 'fs'
import * as path from 'path'
import {
    CharacterCodes,
    isSymbolAllowedInUnquotedString,
    MAX_UNICODE_CODEPOINT,
    lineBreakers,
    reservedCharacters,
    whitespaces,
    unquotedStringAllowed,
} from './character'
import { range } from 'commons/lib/utils/range'
import { PseudoRandomNumberGenerator, fuzzyTest } from 'testing/lib/fuzz/fuzz'
import { ErrorResult, Results, ValueResult } from 'commons/lib/utils/result'
import { Option } from 'commons/lib/utils/option'
import { Cursor } from 'commons/lib/data-structures/cursor'

const snapshot_file = fs.readFileSync(
    path.resolve('./test-files/tokenizer_snapshot_file'),
    'utf-8'
)

class TokenizerFuzzer {
    private static defaultOptions = {
        stringLength: 10,
    }

    private options: typeof TokenizerFuzzer.defaultOptions

    constructor(
        options: Option<Partial<typeof TokenizerFuzzer.defaultOptions>>
    ) {
        this.options = {
            ...TokenizerFuzzer.defaultOptions,
            ...options,
        }
    }

    fuzz(prng: PseudoRandomNumberGenerator): string {
        let str = ''
        for (const _ of range(0, this.options.stringLength)) {
            // Unicode characters are allowed to be from the range 0x0 to 0x10ffff
            const codePoint = Math.round(prng() * 0x10ffff)
            str += String.fromCodePoint(codePoint)
        }
        return str
    }
}

describe('Tokenizer', function () {
    test('Snapshot', function () {
        expect(Tokenizer.tokenize(snapshot_file)).toMatchSnapshot()
    })

    describe('Manual', function () {
        test('Symbols', function () {
            const pairs = [
                [`(`, { token: { kind: 'left_paren' } }],
                [`)`, { token: { kind: 'right_paren' } }],
                [`-`, { token: { kind: 'minus' } }],
                [`+`, { token: { kind: 'plus' } }],
                [`;`, { token: { kind: 'semicolon' } }],
                [`/`, { token: { kind: 'forward_slash' } }],
                ['*', { token: { kind: 'star' } }],
                ['!', { token: { kind: 'bang' } }],
                ['=', { token: { kind: 'equal' } }],
                ['>', { token: { kind: 'greater' } }],
                ['<', { token: { kind: 'less' } }],
                [
                    '!=',
                    { sourcePosition: [0, 2], token: { kind: 'bang_equal' } },
                ],
                [
                    '==',
                    { sourcePosition: [0, 2], token: { kind: 'equal_equal' } },
                ],
                [
                    '>=',
                    {
                        sourcePosition: [0, 2],
                        token: { kind: 'greater_equal' },
                    },
                ],
                [
                    '<=',
                    { sourcePosition: [0, 2], token: { kind: 'less_equal' } },
                ],
                ['&&', { sourcePosition: [0, 2], token: { kind: 'and' } }],
                ['||', { sourcePosition: [0, 2], token: { kind: 'or' } }],
                ['|', { token: { kind: 'pipe' } }],
            ] as const
            for (const pair of pairs) {
                expect(Tokenizer.tokenize(pair[0])).toMatchObject({
                    spans: [
                        {
                            sourcePosition: [0, 1],
                            ...pair[1],
                        },
                    ],
                })
            }
        })

        test('Whitespace', function () {
            const whitespace = whitespaces.map((codePoint) =>
                String.fromCodePoint(codePoint)
            )
            for (const space of whitespace) {
                expect(Tokenizer.tokenize(space)).toMatchObject({ spans: [] })
            }
        })

        test('Line breakers', function () {
            const breakers = lineBreakers.map((codePoint) =>
                String.fromCodePoint(codePoint)
            )
            breakers.push(
                // A CarriageReturn followed by a LineFeed must be tokenized as a single semicolon.
                `${String.fromCodePoint(CharacterCodes.CarriageReturn)}${String.fromCodePoint(CharacterCodes.LineFeed)}`
            )
            for (const breaker of breakers) {
                expect(Tokenizer.tokenize(breaker)).toMatchObject({
                    spans: [
                        {
                            token: { kind: 'semicolon' },
                            sourcePosition: [0, breaker.length],
                        },
                    ],
                })
            }
        })

        test('Quoted string', function () {
            const delimiters = [`\'`, `\"`]
            // Quoted strings are allowed to have any unicode character, except the starting delimiter,
            // inside of it.
            for (const codePoint of range(0, MAX_UNICODE_CODEPOINT, 1, true)) {
                const char = String.fromCodePoint(codePoint)
                for (const delimiter of delimiters) {
                    if (char === delimiter) {
                        continue
                    }
                    expect(
                        (
                            Tokenizer.tokenize(
                                `${delimiter}${char}${delimiter}`
                            ) as ValueResult<any>
                        ).spans[0]
                    ).toEqual({
                        token: { kind: 'string', value: char },
                        sourcePosition: [0, delimiter.length * 2 + char.length],
                    })
                }
            }
            // Unfinished strings must error
            expect(
                (Tokenizer.tokenize(`"""`) as ErrorResult<any>).error.errors
            ).toEqual([
                {
                    kind: 'unfinished_string',
                    delimiter: `"`,
                    range: [2, 3],
                },
            ])
            expect(
                (Tokenizer.tokenize(`'''`) as ErrorResult<any>).error.errors
            ).toEqual([
                {
                    kind: 'unfinished_string',
                    delimiter: `'`,
                    range: [2, 3],
                },
            ])
        })

        test('Unquoted string', function () {
            for (const whitespace of whitespaces) {
                const character = String.fromCodePoint(whitespace)
                // Must terminate unquoted string
                expect(
                    (Tokenizer.tokenize(`word${character}`) as ValueResult<any>)
                        .spans
                ).toContainEqual({
                    token: {
                        kind: 'string',
                        value: 'word',
                    },
                    sourcePosition: [0, 4],
                })
                // Must not be included if it comes before the word
                expect(
                    (Tokenizer.tokenize(`${character}word`) as ValueResult<any>)
                        .spans
                ).toContainEqual({
                    token: {
                        kind: 'string',
                        value: 'word',
                    },
                    sourcePosition: [1, 5],
                })
            }
            for (const allowedSymbol of unquotedStringAllowed) {
                const character = String.fromCodePoint(allowedSymbol)
                // Is allowed to start unquoted strings as long as there eventually is an alpha character (currently alpha numeric)
                const starting = `${''.padStart(3, character)}word`
                expect(
                    (Tokenizer.tokenize(starting) as ValueResult<any>).spans
                ).toContainEqual({
                    token: {
                        kind: 'string',
                        value: starting,
                    },
                    sourcePosition: [0, 7],
                })
                // Is allowed at the end of unquoted strings
                const ending = `word${''.padStart(3, character)}`
                expect(
                    (Tokenizer.tokenize(ending) as ValueResult<any>).spans
                ).toContainEqual({
                    token: {
                        kind: 'string',
                        value: ending,
                    },
                    sourcePosition: [0, 7],
                })
                // Is allowed withing unquoted strings
                const within = `word${''.padStart(3, character)}w`
                expect(
                    (Tokenizer.tokenize(within) as ValueResult<any>).spans
                ).toContainEqual({
                    token: {
                        kind: 'string',
                        value: within,
                    },
                    sourcePosition: [0, 8],
                })
            }
            for (const specialCharacter of [
                ...lineBreakers,
                ...reservedCharacters.filter(
                    (c) =>
                        !isSymbolAllowedInUnquotedString(
                            String.fromCodePoint(c)
                        )
                ),
            ]) {
                const delimiters = [`\'`, `\"`]
                const character = String.fromCodePoint(specialCharacter)
                if (delimiters.includes(character)) {
                    continue
                }
                // Must terminate unquoted string
                expect(
                    (Tokenizer.tokenize(`word${character}`) as ValueResult<any>)
                        .spans
                ).toContainEqual({
                    token: {
                        kind: 'string',
                        value: 'word',
                    },
                    sourcePosition: [0, 4],
                })
                // Must not be included if it comes before the word
                expect(
                    (Tokenizer.tokenize(`${character}word`) as ValueResult<any>)
                        .spans
                ).toContainEqual({
                    token: {
                        kind: 'string',
                        value: 'word',
                    },
                    sourcePosition: [1, 5],
                })
            }
        })
    })

    test('Fuzzy test for unexpected crashes', function () {
        expect(
            fuzzyTest(
                new TokenizerFuzzer(null),
                (unicodeString) => {
                    Tokenizer.tokenize(unicodeString)
                },
                { iterations: 100_000 }
            )
        ).toEqual(Results.ok(undefined))
    })

    test('isEventuallyFollowedByUnicodeAlpha', function () {
        expect(
            isEventuallyFollowedByUnicodeAlpha(new Cursor('-+/*!=<>&|'))
        ).toEqual(false)
        expect(
            isEventuallyFollowedByUnicodeAlpha(new Cursor('-+/*!=<>&|a'))
        ).toEqual(true)
    })
})
