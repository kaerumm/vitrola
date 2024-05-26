import { Cursor } from 'commons/lib/data-structures/cursor'
import { Result, Results } from 'commons/lib/utils/result'
import {
    ASTBinary,
    ASTBlock,
    ASTCommand,
    ASTExpression,
    ASTGroup,
    ASTNode,
    ASTString,
    ASTUnit,
} from './ast'
import { Options, type Option } from 'commons/lib/utils/option'
import {
    And,
    LeftParen,
    Or,
    Span,
    StringToken,
    Token,
    isBinaryOperator,
    isGroupingSpan,
    isStringSpan,
} from './tokens'
import { DSLError, PartialDSLError } from '../commander'
import { Range } from 'commons/lib/utils/range'
import { unreachable } from 'commons/lib/utils/error'
import { Tokenizer } from './tokenizer'
import { LocalizationManager } from '../../localization/localization_manager'

export type ParserError =
    | BinaryExpressionRHSMissing
    | UnexpectedToken
    | ExpectedGroupCloser

interface BinaryExpressionRHSMissing {
    kind: 'binary_expression_rhs_missing'
    range: Range
}

interface UnexpectedToken {
    kind: 'unexpected_token'
    token: Token
    range: Range
}

interface ExpectedGroupCloser {
    kind: 'expected_group_closer'
    groupToken: Token
    range: Range
}

export class Parser {
    public static parse(
        spans: Span<Token>[]
    ): Result<ASTNode<ASTBlock>, ParserError[]> {
        const nodes: ASTNode<ASTExpression>[] = []
        const errors: ParserError[] = []
        let lastTokenWithinError = -1
        const cursor = new Cursor(spans)
        let next
        while ((next = cursor.peek(0))) {
            const result = this.expression(cursor)
            if (Results.isErr(result)) {
                lastTokenWithinError = result.error.range[1]
                errors.push(result.error)
                continue
            }
            if (Options.isSome(result)) {
                nodes.push(result)
            }
        }
        if (errors.length > 0) {
            return Results.error(errors)
        }
        return Results.ok({
            expression: ASTBlock(nodes),
            tokenRange: [0, spans.length - 1],
        })
    }

    private static expression(
        cursor: Cursor<Span<Token>>
    ): Result<Option<ASTNode<ASTExpression>>, ParserError> {
        return this.connective(cursor)
    }
    private static connective(
        cursor: Cursor<Span<Token>>
    ): Result<Option<ASTNode<ASTExpression>>, ParserError> {
        let primaryNode = this.primary(cursor)
        if (Results.isErr(primaryNode) || !primaryNode) {
            return primaryNode
        }
        let node = primaryNode
        while (isBinaryOperator(cursor.peek(0))) {
            const span = cursor.next() as Span<And | Or>
            const rhs = this.primary(cursor)
            if (Results.isErr(rhs)) {
                return rhs
            }
            if (!rhs) {
                return Results.error({
                    kind: 'binary_expression_rhs_missing',
                    range: [node.tokenRange[0], cursor.position - 1],
                })
            }
            node = {
                expression: ASTBinary(node, rhs, span.token),
                tokenRange: [node.tokenRange[0], rhs.tokenRange[1]],
            }
        }
        return node
    }

    private static primary(
        cursor: Cursor<Span<Token>>
    ): Result<Option<ASTNode<ASTExpression>>, ParserError> {
        const span = cursor.next()
        if (!span) {
            return Results.ok(span)
        }
        if (isStringSpan(span)) {
            return this.command(span, cursor)
        }
        if (isGroupingSpan(span)) {
            return this.group(span, cursor)
        }
        if (span.token.kind === 'semicolon') {
            return Results.ok(null)
        }
        return Results.error({
            kind: 'unexpected_token',
            token: span.token,
            range: [cursor.position - 1, cursor.position - 1],
        })
    }

    private static command(
        span: Span<StringToken>,
        cursor: Cursor<Span<Token>>
    ): Result<ASTNode<ASTExpression>, ParserError> {
        const args: ASTNode<ASTString>[] = [
            {
                expression: ASTString(span.token.value),
                tokenRange: [cursor.position - 1, cursor.position - 1],
            },
        ]
        while (cursor.peek(0)?.token.kind === 'string') {
            const next = cursor.next()! as Span<StringToken>
            args.push({
                expression: ASTString(next.token.value),
                tokenRange: [cursor.position - 1, cursor.position - 1],
            })
        }
        return Results.ok({
            expression: ASTCommand(args),
            // SAFE: We are guaranteed to have atleast one element inside args.
            tokenRange: [args.at(0)!.tokenRange[0], args.at(-1)!.tokenRange[1]],
        })
    }

    private static group(
        delimiter: Span<LeftParen>,
        cursor: Cursor<Span<Token>>
    ): Result<ASTNode<ASTExpression>, ParserError> {
        const startingPosition = cursor.position - 1
        // We allow empty groups to exist, so we check first if next token is a closing paren
        if (cursor.peek(0)?.token.kind === 'right_paren') {
            cursor.next()
            return Results.ok({
                expression: ASTGroup({
                    expression: ASTUnit,
                    tokenRange: [startingPosition, cursor.position - 1],
                }),
                tokenRange: [startingPosition, cursor.position - 1],
            })
        }
        const node = this.expression(cursor)
        if (Results.isErr(node)) {
            return node
        }
        if (node === null || cursor.next()?.token.kind !== 'right_paren') {
            return Results.error({
                kind: 'expected_group_closer',
                groupToken: delimiter.token,
                range: [startingPosition, cursor.position - 1],
            })
        }
        return Results.ok({
            expression: ASTGroup(node),
            tokenRange: [startingPosition, cursor.position - 1],
        })
    }

    static intoDSLError(
        tokens: Span<Token>[],
        parserError: ParserError,
        newlines: number[],
        source: string
    ): DSLError {
        const firstToken = tokens[parserError.range[0]].sourcePosition[0]
        const lastToken = tokens[parserError.range[1]].sourcePosition[1]
        return {
            kind: 'command_failed',
            ...Tokenizer.columnLineSourceForTokenRange(
                firstToken,
                lastToken,
                newlines,
                source
            ),
            ...this.parserErrorMessageHint(parserError),
        }
    }

    private static parserErrorMessageHint(
        parserError: ParserError
    ): PartialDSLError {
        switch (parserError.kind) {
            case 'unexpected_token':
                return this.unexpectedToken(parserError)
            case 'expected_group_closer':
                return this.expectedGroupCloser(parserError)
            case 'binary_expression_rhs_missing':
                return this.binaryExpressionRHSMissing(parserError)
        }
    }

    private static unexpectedToken(
        parserError: UnexpectedToken
    ): PartialDSLError {
        return {
            errorMessage: LocalizationManager.lazy(
                'interpreter',
                'parser_unexpected_token',
                [Tokenizer.tokenIntoString(parserError.token)]
            ),
            hint: LocalizationManager.lazy(
                'interpreter',
                'parser_unexpected_token_hint',
                [Tokenizer.tokenIntoString(parserError.token)]
            ),
        }
    }

    private static expectedGroupCloser(
        parserError: ExpectedGroupCloser
    ): PartialDSLError {
        return {
            errorMessage: LocalizationManager.lazy(
                'interpreter',
                'parser_expected_group_closer',
                [
                    Tokenizer.tokenIntoString(
                        Tokenizer.pairFor(parserError.groupToken)
                    ),
                ]
            ),
            hint: LocalizationManager.lazy(
                'interpreter',
                'parser_expected_group_closer_hint',
                [
                    Tokenizer.tokenIntoString(
                        Tokenizer.pairFor(parserError.groupToken) ?? '??'
                    ),
                ]
            ),
        }
    }

    private static binaryExpressionRHSMissing(
        _parserError: ParserError
    ): PartialDSLError {
        return {
            errorMessage: LocalizationManager.lazy(
                'interpreter',
                'parser_binary_expression_rhs_missing',
                undefined
            ),
            hint: LocalizationManager.lazy(
                'interpreter',
                'parser_binary_expression_rhs_missing_hint',
                undefined
            ),
        }
    }

    // Utility function for testing, should maybe be moved from here
    static parseOrUnreachable(spans: Span<Token>[]): ASTNode<ASTBlock> {
        return Results.mapOrElse(Parser.parse(spans), () =>
            unreachable(
                'This function should only be called when it is guaranteed the tokenization will not fail'
            )
        )
    }
}
