import { Cursor } from '../data-structures/cursor'
import { Result, Results } from '../utils/result'
import { Option } from '../utils/option'
import {
    CronExpression,
    DayOfMonthRange,
    DayOfWeekRange,
    Expression,
    HourRange,
    ListExpression,
    MinuteRange,
    MonthRange,
    TimeExpression,
    TimeRange,
    TimeRanges,
    dayOfMonth,
    dayOfWeek,
    hour,
    isInDayOfMonthRange,
    isInDayOfWeekRange,
    isInHourRange,
    isInMinuteRange,
    isInMonthRange,
    minute,
    month,
} from './expression'
import { Comma, Dash, ForwardSlash, Token, Number } from './tokenizer'
import { unreachable } from '../utils/error'

export interface InvalidValue {
    kind: 'invalid_value'
    value: number
    expectedRange: [number, number]
}

export interface ExpectedValue {
    kind: 'expected_value'
}

export interface UnexpectedToken {
    kind: 'unexpected_token'
    token: string
}

export type CronParserError = InvalidValue | ExpectedValue | UnexpectedToken

export class Parser {
    static parse(tokens: Token[]): Result<CronExpression, CronParserError> {
        // Typescript is being dumb here, and fixing it takes too much time so we have to
        // accept the red squiggly line :(
        const cursor = new Cursor<Token>(tokens)
        return this.expression(cursor)
    }

    static expression(
        cursor: Cursor<Token>
    ): Result<CronExpression, CronParserError> {
        const minute = this.array(cursor, 'minute')
        if (Results.isErr(minute)) {
            return minute
        }
        const hour = this.array(cursor, 'hour')
        if (Results.isErr(hour)) {
            return hour
        }
        const dayOfMonth = this.array(cursor, 'dayOfMonth')
        if (Results.isErr(dayOfMonth)) {
            return dayOfMonth
        }
        const month = this.array(cursor, 'month')
        if (Results.isErr(month)) {
            return month
        }
        const dayOfWeek = this.array(cursor, 'dayOfWeek')
        if (Results.isErr(dayOfWeek)) {
            return dayOfWeek
        }
        return {
            kind: 'cron_expression',
            minute,
            hour,
            dayOfMonth,
            month,
            dayOfWeek,
        }
    }

    static array<T extends TimeRange>(
        cursor: Cursor<Token>,
        timeRange: T
    ): Result<TimeExpression<TimeRanges[T]>, CronParserError> {
        let firstElement = this.connective(cursor, timeRange)
        if (Results.isErr(firstElement)) {
            return firstElement
        }
        let elements = [firstElement]
        while (isListDelimiter(cursor.peek(0))) {
            let _ = cursor.next() as Comma
            const element = this.connective(cursor, timeRange)
            if (Results.isErr(element)) {
                return element
            }
            elements.push(element)
        }
        return { kind: 'list', elements }
    }

    static connective<T extends TimeRange>(
        cursor: Cursor<Token>,
        timeRange: T
    ): Result<TimeExpression<TimeRanges[T]>, CronParserError> {
        let primaryNode = this.primary(cursor, timeRange)
        if (Results.isErr(primaryNode)) {
            return primaryNode
        }
        let node = primaryNode
        while (isConnective(cursor.peek(0))) {
            const token = cursor.next() as Dash | ForwardSlash
            const rhs = this.primary(cursor, timeRange)
            if (Results.isErr(rhs)) {
                return rhs
            }
            node = {
                kind: 'binary_expression',
                lhs: primaryNode,
                rhs,
                op: token.kind,
            }
        }
        return node
    }

    static primary<T extends TimeRange>(
        cursor: Cursor<Token>,
        timeRange: T
    ): Result<TimeExpression<TimeRanges[T]>, CronParserError> {
        const next = cursor.next()
        if (!next) {
            return Results.error({ kind: 'expected_value' })
        }
        if (next.kind === 'star') {
            return { kind: 'every_possible_time' }
        }
        if (next.kind === 'number') {
            return this.value(next, timeRange)
        }
        return Results.error({
            kind: 'unexpected_token',
            token: next.kind,
        })
    }

    static value<T extends TimeRange>(
        next: Number,
        timeRange: T
    ): Result<TimeExpression<TimeRanges[T]>, CronParserError> {
        switch (timeRange) {
            case 'minute':
                return this.minute(next) as TimeExpression<TimeRanges[T]>
            case 'hour':
                return this.hour(next) as TimeExpression<TimeRanges[T]>
            case 'dayOfMonth':
                return this.dayOfMonth(next) as TimeExpression<TimeRanges[T]>
            case 'month':
                return this.month(next) as TimeExpression<TimeRanges[T]>
            case 'dayOfWeek':
                return this.dayOfWeek(next) as TimeExpression<TimeRanges[T]>
        }
        unreachable('Switch statement should cover all cases')
    }

    static minute(
        next: Number
    ): Result<TimeExpression<MinuteRange>, CronParserError> {
        if (!isInMinuteRange(next.value)) {
            return Results.error({
                kind: 'invalid_value',
                value: next.value,
                expectedRange: [0, 59],
            })
        }
        return minute(next.value)
    }

    static hour(
        next: Number
    ): Result<TimeExpression<HourRange>, CronParserError> {
        if (!isInHourRange(next.value)) {
            return Results.error({
                kind: 'invalid_value',
                value: next.value,
                expectedRange: [0, 23],
            })
        }
        return hour(next.value)
    }

    static dayOfMonth(
        next: Number
    ): Result<TimeExpression<DayOfMonthRange>, CronParserError> {
        if (!isInDayOfMonthRange(next.value)) {
            return Results.error({
                kind: 'invalid_value',
                value: next.value,
                expectedRange: [1, 31],
            })
        }
        return dayOfMonth(next.value)
    }

    static month(
        next: Number
    ): Result<TimeExpression<MonthRange>, CronParserError> {
        if (!isInMonthRange(next.value)) {
            return Results.error({
                kind: 'invalid_value',
                value: next.value,
                expectedRange: [1, 12],
            })
        }
        return month(next.value)
    }

    static dayOfWeek(
        next: Number
    ): Result<TimeExpression<DayOfWeekRange>, CronParserError> {
        if (!isInDayOfWeekRange(next.value)) {
            return Results.error({
                kind: 'invalid_value',
                value: next.value,
                expectedRange: [0, 6],
            })
        }
        return dayOfWeek(next.value)
    }
}

export function isConnective(token: Option<Token>) {
    return token && (token.kind === 'dash' || token.kind === 'forward_slash')
}

export function isListDelimiter(token: Option<Token>) {
    return token && token.kind === 'comma'
}
