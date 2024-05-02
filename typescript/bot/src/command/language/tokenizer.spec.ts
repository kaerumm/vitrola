import { describe, test, expect } from '@jest/globals'
import { Tokenizer } from './tokenizer'
import * as fs from 'fs'
import * as path from 'path'
import {
    CharacterCodes,
    MAX_UNICODE_CODEPOINT,
    lineBreakers,
    reservedCharacters,
    whitespaces,
} from './character'
import { range } from 'commons/lib/utils/range'
import { PseudoRandomNumberGenerator, fuzzyTest } from 'testing/lib/fuzz/fuzz'
import { Results } from 'commons/lib/utils/result'
import { Option } from 'commons/lib/utils/option'
import { Span } from './tokens'

console.log(path.resolve('./test-files/tokenizer_snapshot_file'))
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
                ['!=', { token: { kind: 'bang_equal' } }],
                ['==', { token: { kind: 'equal_equal' } }],
                ['>=', { token: { kind: 'greater_equal' } }],
                ['<=', { token: { kind: 'less_equal' } }],
                ['&&', { token: { kind: 'and' } }],
                ['||', { token: { kind: 'or' } }],
                ['|', { token: { kind: 'pipe' } }],
            ] as const
            for (const pair of pairs) {
                expect(Tokenizer.tokenize(pair[0])).toEqual([
                    {
                        ...pair[1],
                        position: 0,
                    },
                ])
            }
        })

        test('Whitespace', function () {
            const whitespace = whitespaces.map((codePoint) =>
                String.fromCodePoint(codePoint)
            )
            for (const space of whitespace) {
                expect(Tokenizer.tokenize(space)).toStrictEqual([])
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
                expect(Tokenizer.tokenize(breaker)).toStrictEqual([
                    {
                        token: { kind: 'semicolon' },
                        position: 0,
                    },
                ])
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
                        Tokenizer.tokenize(`${delimiter}${char}${delimiter}`)
                    ).toEqual([
                        { token: { kind: 'string', value: char }, position: 0 },
                    ])
                }
            }
            // Unfinished strings must error
            expect(Tokenizer.tokenize(`"""`)).toEqual({
                error: [{ kind: 'unfinished_string', position: 2 }],
            })
            expect(Tokenizer.tokenize(`'''`)).toEqual({
                error: [{ kind: 'unfinished_string', position: 2 }],
            })
        })

        test('Unquoted string', function () {
            for (const whitespace of whitespaces) {
                const character = String.fromCodePoint(whitespace)
                // Must terminate unquoted string
                expect(Tokenizer.tokenize(`word${character}`)).toStrictEqual([
                    {
                        token: {
                            kind: 'string',
                            value: 'word',
                        },
                        position: 0,
                    },
                ])
                // Must not be included if it comes before the word
                expect(Tokenizer.tokenize(`${character}word`)).toEqual([
                    {
                        token: {
                            kind: 'string',
                            value: 'word',
                        },
                        position: 1,
                    },
                ])
            }
            for (const specialCharacter of [
                ...lineBreakers,
                ...reservedCharacters,
            ]) {
                const delimiters = [`\'`, `\"`]
                const character = String.fromCodePoint(specialCharacter)
                if (delimiters.includes(character)) {
                    continue
                }
                // Must terminate unquoted string
                expect(
                    (Tokenizer.tokenize(`word${character}`) as Span[])[0]
                ).toStrictEqual({
                    token: {
                        kind: 'string',
                        value: 'word',
                    },
                    position: 0,
                })
                // Must not be included if it comes before the word
                expect(
                    (Tokenizer.tokenize(`${character}word`) as Span[]).find(
                        (s) =>
                            s.token.kind === 'string' &&
                            s.token.value === 'word'
                    )
                ).toBeTruthy()
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
})
