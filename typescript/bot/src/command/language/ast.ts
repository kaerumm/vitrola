export interface ASTNode {
    expression: ASTExpression
    tokenPosition: number
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
    lhs: ASTExpression
    rhs: ASTExpression
}

export interface ASTGroup {
    kind: 'group'
    expression: ASTExpression
}

export interface ASTCommand {
    kind: 'command'
    arguments: ASTString[]
}

export interface ASTUnit {
    kind: 'unit'
}

export interface ASTBlock {
    kind: 'block'
    expressions: ASTExpression[]
}

export function ASTString(value: string): ASTString {
    return {
        kind: 'string',
        value,
    }
}

export function ASTBinary(
    lhs: ASTExpression,
    rhs: ASTExpression,
    operator: ASTBinaryOperator
): ASTBinary {
    return {
        kind: 'binary',
        lhs,
        rhs,
        operator,
    }
}

export function ASTGroup(expression: ASTExpression): ASTGroup {
    return {
        kind: 'group',
        expression,
    }
}

export function ASTCommand(literals: ASTString[]): ASTCommand {
    return {
        kind: 'command',
        arguments: literals,
    }
}

export const ASTUnit: Readonly<ASTUnit> = { kind: 'unit' }

export function ASTBlock(expressions: ASTExpression[]): ASTBlock {
    return {
        kind: 'block',
        expressions,
    }
}
