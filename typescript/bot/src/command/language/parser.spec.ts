import { describe, expect, test } from 'bun:test'
import { Parser } from './parser'
import { Tokenizer } from './tokenizer'
import { Span, Token } from './tokens'
import { Results } from 'commons/lib/utils/result'
import {
    ASTBinary,
    ASTBlock,
    ASTCommand,
    ASTGroup,
    ASTString,
    ASTUnit,
} from './ast'

describe('Parser', function () {
    test('Command expressions', function () {
        // Command with zero arguments
        let spans = Tokenizer.tokenize('command') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([ASTCommand([ASTString('command')])]),
            tokenPosition: 0,
        })
        // Command with one argument
        spans = Tokenizer.tokenize('command argument') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTCommand([ASTString('command'), ASTString('argument')]),
            ]),
            tokenPosition: 0,
        })
        // Command with many arguments
        spans = Tokenizer.tokenize('command 0 1 2 3 4 5') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTCommand(
                    [ASTString('command')].concat(
                        '0 1 2 3 4 5'.split(' ').map((s) => ASTString(s))
                    )
                ),
            ]),
            tokenPosition: 0,
        })
    })

    test('List expressions', function () {
        let spans = Tokenizer.tokenize(';command') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([ASTCommand([ASTString('command')])]),
            tokenPosition: 0,
        })
    })

    test('Group expressions', function () {
        let spans = Tokenizer.tokenize('(command)') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTGroup(ASTCommand([ASTString('command')])),
            ]),
            tokenPosition: 0,
        })
        spans = Tokenizer.tokenize('()') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([ASTGroup(ASTUnit)]),
            tokenPosition: 0,
        })
        // A group expression must be closed
        spans = Tokenizer.tokenize('(') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual(
            Results.error([{ kind: 'expected_group_closer', tokenPosition: 1 }])
        )
        spans = Tokenizer.tokenize('(command') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual(
            Results.error([{ kind: 'expected_group_closer', tokenPosition: 2 }])
        )
        spans = Tokenizer.tokenize(')') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual(
            Results.error([{ kind: 'unexpected_token', tokenPosition: 0 }])
        )
    })

    test('Connective expressions', function () {
        let spans = Tokenizer.tokenize('command && command') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTBinary(
                    ASTCommand([ASTString('command')]),
                    ASTCommand([ASTString('command')]),
                    { kind: 'and' }
                ),
            ]),
            tokenPosition: 0,
        })
        spans = Tokenizer.tokenize('command || command') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTBinary(
                    ASTCommand([ASTString('command')]),
                    ASTCommand([ASTString('command')]),
                    { kind: 'or' }
                ),
            ]),
            tokenPosition: 0,
        })
        spans = Tokenizer.tokenize('command ||') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual({
            error: [
                {
                    kind: 'binary_expression_rhs_missing',
                    tokenPosition: 0,
                },
            ],
        })
        spans = Tokenizer.tokenize('command || )') as Span<Token>[]
        expect(Parser.parse(spans)).toEqual({
            error: [
                {
                    kind: 'unexpected_token',
                    tokenPosition: 2,
                },
            ],
        })
    })
})
