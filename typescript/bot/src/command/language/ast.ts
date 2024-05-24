import { Range } from 'commons/lib/utils/range'

export interface ASTNode<Expression extends ASTExpression> {
    expression: Expression
    tokenRange: Range
}

export type ASTExpression =
    | ASTBinary
    | ASTCommand
    | ASTGroup
    | ASTString
    | ASTUnit
    | ASTBlock

export interface ASTString {
    kind: 'string'
    value: string
}

export interface ASTBinaryAnd {
    kind: 'and'
}

export interface ASTBinaryOr {
    kind: 'or'
}

export type ASTBinaryOperator = ASTBinaryAnd | ASTBinaryOr

export interface ASTBinary {
    kind: 'binary'
    operator: ASTBinaryOperator
    lhs: ASTNode<ASTExpression>
    rhs: ASTNode<ASTExpression>
}

export interface ASTGroup {
    kind: 'group'
    node: ASTNode<ASTExpression>
}

export interface ASTCommand {
    kind: 'command'
    arguments: ASTNode<ASTString>[]
}

export interface ASTUnit {
    kind: 'unit'
}

export interface ASTBlock {
    kind: 'block'
    nodes: ASTNode<ASTExpression>[]
}

export function ASTString(value: string): ASTString {
    return {
        kind: 'string',
        value,
    }
}

export function ASTBinary(
    lhs: ASTNode<ASTExpression>,
    rhs: ASTNode<ASTExpression>,
    operator: ASTBinaryOperator
): ASTBinary {
    return {
        kind: 'binary',
        lhs,
        rhs,
        operator,
    }
}

export function ASTGroup(expression: ASTNode<ASTExpression>): ASTGroup {
    return {
        kind: 'group',
        node: expression,
    }
}

export function ASTCommand(literals: ASTNode<ASTString>[]): ASTCommand {
    return {
        kind: 'command',
        arguments: literals,
    }
}

export const ASTUnit: Readonly<ASTUnit> = { kind: 'unit' }

export function ASTBlock(expressions: ASTNode<ASTExpression>[]): ASTBlock {
    return {
        kind: 'block',
        nodes: expressions,
    }
}

export function ASTNode<Expression extends ASTExpression>(
    expression: Expression,
    tokenRange: Range
): ASTNode<Expression> {
    return {
        expression,
        tokenRange,
    }
}
