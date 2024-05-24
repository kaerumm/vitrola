import { describe, expect, test } from 'bun:test'
import { Parser } from './parser'
import { Tokenizer } from './tokenizer'
import { Span, Token } from './tokens'
import { Results, ValueResult } from 'commons/lib/utils/result'
import {
    ASTBinary,
    ASTBlock,
    ASTCommand,
    ASTGroup,
    ASTNode,
    ASTString,
    ASTUnit,
} from './ast'

describe('Parser', function () {
    test('Command expressions', function () {
        // Command with zero arguments
        let spans = (Tokenizer.tokenize('command') as ValueResult<any>).spans
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTNode(
                    ASTCommand([ASTNode(ASTString('command'), [0, 0])]),
                    [0, 0]
                ),
            ]),
            tokenRange: [0, 0],
        })
        // Command with one argument
        spans = (Tokenizer.tokenize('command argument') as ValueResult<any>)
            .spans
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTNode(
                    ASTCommand([
                        ASTNode(ASTString('command'), [0, 0]),
                        ASTNode(ASTString('argument'), [1, 1]),
                    ]),
                    [0, 1]
                ),
            ]),
            tokenRange: [0, 1],
        })
        // Command with many arguments
        spans = (Tokenizer.tokenize('command 0 1 2 3 4 5') as ValueResult<any>)
            .spans
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTNode(
                    ASTCommand(
                        [ASTNode(ASTString('command'), [0, 0])].concat(
                            '0 1 2 3 4 5'
                                .split(' ')
                                .map((s, i) =>
                                    ASTNode(ASTString(s), [i + 1, i + 1])
                                )
                        )
                    ),
                    [0, 6]
                ),
            ]),
            tokenRange: [0, 6],
        })
    })

    test('List expressions', function () {
        let spans = (Tokenizer.tokenize(';command') as ValueResult<any>).spans
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTNode(
                    ASTCommand([ASTNode(ASTString('command'), [1, 1])]),
                    [1, 1]
                ),
            ]),
            tokenRange: [0, 1],
        })
    })

    test('Group expressions', function () {
        let spans = (Tokenizer.tokenize('(command)') as ValueResult<any>).spans
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTNode(
                    ASTGroup(
                        ASTNode(
                            ASTCommand([ASTNode(ASTString('command'), [1, 1])]),
                            [1, 1]
                        )
                    ),
                    [0, 2]
                ),
            ]),
            tokenRange: [0, 2],
        })
        spans = (Tokenizer.tokenize('()') as ValueResult<any>).spans
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTNode(ASTGroup(ASTNode(ASTUnit, [0, 1])), [0, 1]),
            ]),
            tokenRange: [0, 1],
        })
        // A group expression must be closed
        spans = (Tokenizer.tokenize('(') as ValueResult<any>).spans
        expect(Parser.parse(spans)).toEqual(
            Results.error([
                {
                    groupToken: { kind: 'left_paren' },
                    kind: 'expected_group_closer',
                    range: [0, 0],
                },
            ])
        )
        spans = (Tokenizer.tokenize('(command') as ValueResult<any>).spans
        expect(Parser.parse(spans)).toEqual(
            Results.error([
                {
                    groupToken: { kind: 'left_paren' },
                    kind: 'expected_group_closer',
                    range: [0, 1],
                },
            ])
        )
        spans = (Tokenizer.tokenize(')') as ValueResult<any>).spans
        expect(Parser.parse(spans)).toEqual(
            Results.error([
                {
                    kind: 'unexpected_token',
                    token: { kind: 'right_paren' },
                    range: [0, 0],
                },
            ])
        )
    })

    test('Connective expressions', function () {
        let spans = (
            Tokenizer.tokenize('command && command') as ValueResult<any>
        ).spans
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTNode(
                    ASTBinary(
                        ASTNode(
                            ASTCommand([ASTNode(ASTString('command'), [0, 0])]),
                            [0, 0]
                        ),
                        ASTNode(
                            ASTCommand([ASTNode(ASTString('command'), [2, 2])]),
                            [2, 2]
                        ),
                        { kind: 'and' }
                    ),
                    [0, 2]
                ),
            ]),
            tokenRange: [0, 2],
        })
        spans = (Tokenizer.tokenize('command || command') as ValueResult<any>)
            .spans
        expect(Parser.parse(spans)).toEqual({
            expression: ASTBlock([
                ASTNode(
                    ASTBinary(
                        ASTNode(
                            ASTCommand([ASTNode(ASTString('command'), [0, 0])]),
                            [0, 0]
                        ),
                        ASTNode(
                            ASTCommand([ASTNode(ASTString('command'), [2, 2])]),
                            [2, 2]
                        ),
                        { kind: 'or' }
                    ),
                    [0, 2]
                ),
            ]),
            tokenRange: [0, 2],
        })
        spans = (Tokenizer.tokenize('command ||') as ValueResult<any>).spans
        expect(Parser.parse(spans)).toEqual({
            error: [
                {
                    kind: 'binary_expression_rhs_missing',
                    range: [0, 1],
                },
            ],
        })
        spans = (Tokenizer.tokenize('command || )') as ValueResult<any>).spans
        expect(Parser.parse(spans)).toEqual({
            error: [
                {
                    kind: 'unexpected_token',
                    token: { kind: 'right_paren' },
                    range: [2, 2],
                },
            ],
        })
    })
})
