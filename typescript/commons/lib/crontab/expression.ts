export type MinuteRange =
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18
    | 19
    | 20
    | 21
    | 22
    | 23
    | 24
    | 25
    | 26
    | 27
    | 28
    | 29
    | 30
    | 31
    | 32
    | 33
    | 34
    | 35
    | 36
    | 37
    | 38
    | 39
    | 40
    | 41
    | 42
    | 43
    | 44
    | 45
    | 46
    | 47
    | 48
    | 49
    | 50
    | 51
    | 52
    | 53
    | 54
    | 55
    | 56
    | 57
    | 58
    | 59
export type HourRange =
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18
    | 19
    | 20
    | 21
    | 22
    | 23
export type DayOfMonthRange =
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18
    | 19
    | 20
    | 21
    | 22
    | 23
    | 24
    | 25
    | 26
    | 27
    | 28
    | 29
    | 30
    | 31
export type MonthRange = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
export type DayOfWeekRange = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type TimeRanges = {
    minute: MinuteRange
    hour: HourRange
    dayOfMonth: DayOfMonthRange
    month: MonthRange
    dayOfWeek: DayOfWeekRange
}

export type TimeRange = keyof TimeRanges

export interface CronExpression {
    kind: 'cron_expression'
    minute: TimeExpression<MinuteRange>
    hour: TimeExpression<HourRange>
    dayOfMonth: TimeExpression<DayOfMonthRange>
    month: TimeExpression<MonthRange>
    dayOfWeek: TimeExpression<DayOfWeekRange>
}

export interface EveryPossibleTime {
    kind: 'every_possible_time'
}

export interface TimeValue<T extends number> {
    kind: 'time_value'
    value: T
}

export type TimeBinaryOperator = 'dash' | 'forward_slash'

export interface BinaryExpression<T extends number> {
    kind: 'binary_expression'
    lhs: TimeExpression<T>
    rhs: TimeExpression<T>
    op: TimeBinaryOperator
}

export interface ListExpression<T extends number> {
    kind: 'list'
    elements: TimeExpression<T>[]
}

export type TimeExpression<T extends number> =
    | BinaryExpression<T>
    | TimeValue<T>
    | EveryPossibleTime
    | ListExpression<T>

export type Expression = CronExpression | TimeExpression<number>

export function minute(value: MinuteRange): TimeValue<MinuteRange> {
    return { kind: 'time_value', value }
}

export function hour(value: HourRange): TimeValue<HourRange> {
    return { kind: 'time_value', value }
}

export function dayOfMonth(value: DayOfMonthRange): TimeValue<DayOfMonthRange> {
    return { kind: 'time_value', value }
}

export function month(value: MonthRange): TimeValue<MonthRange> {
    return { kind: 'time_value', value }
}

export function dayOfWeek(value: DayOfWeekRange): TimeValue<DayOfWeekRange> {
    return { kind: 'time_value', value }
}

export function isInMinuteRange(value: number): value is MinuteRange {
    return value >= 0 && value <= 59
}

export function isInHourRange(value: number): value is HourRange {
    return value >= 0 && value <= 23
}

export function isInDayOfMonthRange(value: number): value is DayOfMonthRange {
    return value >= 1 && value <= 31
}

export function isInMonthRange(value: number): value is MonthRange {
    return value >= 1 && value <= 12
}

export function isInDayOfWeekRange(value: number): value is DayOfWeekRange {
    return value >= 0 && value <= 6
}
