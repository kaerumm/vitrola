import { test, describe, expect } from 'bun:test'
import { Parser } from './parser'
import {
    DayOfMonthRange,
    DayOfWeekRange,
    HourRange,
    MinuteRange,
    MonthRange,
    minute,
} from './expression'
import { range } from '../utils/range'
import { Results } from '../utils/result'
import { Tokenizer } from './tokenizer'

test('Minute validation', function () {
    const allowed = Array.from(range(0, 59, 1, true))
    for (const number of allowed) {
        expect(
            Parser.parse(Tokenizer.tokenizeOrUnreachable(`${number} * * * *`))[
                'minute'
            ]
        ).toEqual({
            kind: 'list',
            elements: [
                {
                    kind: 'time_value',
                    value: number,
                },
            ],
        })
    }
    expect(Parser.parse(Tokenizer.tokenizeOrUnreachable(`60 * * * *`))).toEqual(
        Results.error({
            kind: 'invalid_value',
            value: 60,
            expectedRange: [0, 59],
        })
    )
})

test('Hour validation', function () {
    for (const number of range(0, 23, 1, true)) {
        expect(
            Parser.parse(Tokenizer.tokenizeOrUnreachable(`* ${number} * * *`))[
                'hour'
            ]
        ).toEqual({
            kind: 'list',
            elements: [
                {
                    kind: 'time_value',
                    value: number,
                },
            ],
        })
    }
    expect(Parser.parse(Tokenizer.tokenizeOrUnreachable('* 24 * * *'))).toEqual(
        Results.error({
            kind: 'invalid_value',
            value: 24,
            expectedRange: [0, 23],
        })
    )
})

test('DayOfMonth', function () {
    for (const number of range(1, 31, 1, true)) {
        expect(
            Parser.parse(Tokenizer.tokenizeOrUnreachable(`* * ${number} * *`))[
                'dayOfMonth'
            ]
        ).toEqual({
            kind: 'list',
            elements: [
                {
                    kind: 'time_value',
                    value: number,
                },
            ],
        })
    }
    expect(Parser.parse(Tokenizer.tokenizeOrUnreachable('* * 32 * *'))).toEqual(
        Results.error({
            kind: 'invalid_value',
            value: 32,
            expectedRange: [1, 31],
        })
    )
})

test('Month', function () {
    for (const number of range(1, 12, 1, true)) {
        expect(
            Parser.parse(Tokenizer.tokenizeOrUnreachable(`* * * ${number} *`))[
                'month'
            ]
        ).toEqual({
            elements: [
                {
                    kind: 'time_value',
                    value: number,
                },
            ],
            kind: 'list',
        })
    }
    expect(Parser.month({ kind: 'number', value: 0 })).toEqual(
        Results.error({
            kind: 'invalid_value',
            value: 0,
            expectedRange: [1, 12],
        })
    )
    expect(Parser.month({ kind: 'number', value: 13 })).toEqual(
        Results.error({
            kind: 'invalid_value',
            value: 13,
            expectedRange: [1, 12],
        })
    )
})

test('DaysOfWeek', function () {
    for (const number of range(0, 6, 1, true)) {
        expect(Parser.dayOfWeek({ kind: 'number', value: number })).toEqual({
            kind: 'time_value',
            value: number as DayOfWeekRange,
        })
    }
    expect(Parser.dayOfWeek({ kind: 'number', value: -1 })).toEqual(
        Results.error({
            kind: 'invalid_value',
            value: -1,
            expectedRange: [0, 6],
        })
    )
    expect(Parser.dayOfWeek({ kind: 'number', value: 7 })).toEqual(
        Results.error({
            kind: 'invalid_value',
            value: 7,
            expectedRange: [0, 6],
        })
    )
})

test('EveryPossibleTime', function () {
    expect(
        Parser.parse(Tokenizer.tokenizeOrUnreachable('* * * * *'))['minute']
    ).toEqual({
        kind: 'list',
        elements: [
            {
                kind: 'every_possible_time',
            },
        ],
    })
})
