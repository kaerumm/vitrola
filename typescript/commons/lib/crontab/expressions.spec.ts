import { describe, test, expect } from 'bun:test'
import { range } from '../utils/range'
import {
    isInDayOfMonthRange,
    isInDayOfWeekRange,
    isInHourRange,
    isInMinuteRange,
    isInMonthRange,
} from './expression'

test('isInMinuteRange', function () {
    for (const number of range(0, 59, 1, true)) {
        expect(isInMinuteRange(number)).toEqual(true)
    }
})

test('isInHourRange', function () {
    for (const number of range(0, 23, 1, true)) {
        expect(isInHourRange(number)).toEqual(true)
    }
})

test('isInDayOfMonthRange', function () {
    for (const number of range(1, 31, 1, true)) {
        expect(isInDayOfMonthRange(number)).toEqual(true)
    }
})

test('isInMonthRange', function () {
    for (const number of range(1, 12, 1, true)) {
        expect(isInMonthRange(number)).toEqual(true)
    }
})

test('isInDayOfWeekRange', function () {
    for (const number of range(0, 6, 1, true)) {
        expect(isInDayOfWeekRange(number)).toEqual(true)
    }
})
