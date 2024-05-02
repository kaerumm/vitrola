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

export interface ParserError {
    kind:
        | 'binary_expression_rhs_missing'
        | 'unexpected_token'
        | 'expected_group_closer'
    tokenPosition: number
}

export class Parser {
    public static parse(spans: Span<Token>[]): Result<ASTNode, ParserError[]> {
        const nodes: ASTNode[] = []
        const errors: ParserError[] = []
        const cursor = new Cursor(spans)
        let next
        while ((next = cursor.peek(0))) {
            const result = this.expression(cursor)
            if (Results.isErr(result)) {
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
            expression: ASTBlock(nodes.map((n) => n.expression)),
            tokenPosition: 0,
        })
    }

    private static expression(
        cursor: Cursor<Span<Token>>
    ): Result<Option<ASTNode>, ParserError> {
        return this.connective(cursor)
    }
    private static connective(
        cursor: Cursor<Span<Token>>
    ): Result<Option<ASTNode>, ParserError> {
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
                    tokenPosition: node.tokenPosition,
                })
            }
            node = {
                expression: ASTBinary(
                    node.expression,
                    rhs.expression,
                    span.token
                ),
                tokenPosition: node.tokenPosition,
            }
        }
        return node
    }

    private static primary(
        cursor: Cursor<Span<Token>>
    ): Result<Option<ASTNode>, ParserError> {
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
            tokenPosition: cursor.position - 1,
        })
    }

    private static command(
        span: Span<StringToken>,
        cursor: Cursor<Span<Token>>
    ): Result<ASTNode, ParserError> {
        const args: ASTString[] = [span.token]
        while (cursor.peek(0)?.token.kind === 'string') {
            args.push((cursor.next()! as Span<StringToken>).token)
        }
        return Results.ok({
            expression: ASTCommand(args),
            tokenPosition: span.position,
        })
    }

    private static group(
        delimiter: Span<LeftParen>,
        cursor: Cursor<Span<Token>>
    ): Result<ASTNode, ParserError> {
        // We allow empty groups to exist, so we check first if next token is a closing paren
        if (cursor.peek(0)?.token.kind === 'right_paren') {
            cursor.next()
            return Results.ok({
                expression: ASTGroup(ASTUnit),
                tokenPosition: delimiter.position,
            })
        }
        const node = this.expression(cursor)
        if (cursor.next()?.token.kind !== 'right_paren') {
            return Results.error({
                kind: 'expected_group_closer',
                tokenPosition: cursor.position,
            })
        }
        let expression: ASTExpression = ASTUnit
        if (Results.isOk(node) && Options.isSome(node)) {
            expression = node.expression
        }
        return Results.ok({
            expression: ASTGroup(expression),
            tokenPosition: delimiter.position,
        })
    }
}
