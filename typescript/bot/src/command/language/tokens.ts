import { Option } from 'commons/lib/utils/option'

// Literals
export interface StringToken {
    kind: 'string'
    value: string
}

// One or two character tokens
export interface LeftParen {
    kind: 'left_paren'
}
export interface RightParen {
    kind: 'right_paren'
}
export interface Minus {
    kind: 'minus'
}
export interface Plus {
    kind: 'plus'
}
export interface Semicolon {
    kind: 'semicolon'
}
export interface ForwardSlash {
    kind: 'forward_slash'
}
export interface Star {
    kind: 'star'
}
export interface Bang {
    kind: 'bang'
}
export interface BangEqual {
    kind: 'bang_equal'
}
export interface Equal {
    kind: 'equal'
}
export interface EqualEqual {
    kind: 'equal_equal'
}
export interface Greater {
    kind: 'greater'
}
export interface GreaterEqual {
    kind: 'greater_equal'
}
export interface Less {
    kind: 'less'
}
export interface LessEqual {
    kind: 'less_equal'
}
export interface Pipe {
    kind: 'pipe'
}
export interface And {
    kind: 'and'
}
export interface Or {
    kind: 'or'
}

export type Token =
    | LeftParen
    | RightParen
    | StringToken
    | Minus
    | Plus
    | Semicolon
    | ForwardSlash
    | Star
    | Bang
    | BangEqual
    | Equal
    | EqualEqual
    | Greater
    | GreaterEqual
    | Less
    | LessEqual
    | Pipe
    | And
    | Or

export interface Span<T extends Token = Token> {
    token: T
    position: number
}

export interface SyntaxError {
    kind: 'unfinished_string'
    position: number
}

export function isBinaryOperator(
    span: Option<Span<Token>>
): span is Span<And | Or> {
    return !!span && ['and', 'or'].includes(span.token.kind)
}

export function isStringSpan(span: Span<Token>): span is Span<StringToken> {
    return span.token.kind === 'string'
}

export function isGroupingSpan(span: Span<Token>): span is Span<LeftParen> {
    return span.token.kind === 'left_paren'
}
