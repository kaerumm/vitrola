import { expect, test } from 'bun:test'
import {
    hours,
    intoHours,
    intoMinutes,
    intoSeconds,
    minutes,
    seconds,
} from './time'
import { range } from './range'

test('Time', function () {
    for (const number of range(0, 10_000)) {
        expect(intoSeconds(seconds(number))).toEqual(number)
        expect(intoMinutes(minutes(number))).toEqual(number)
        expect(intoHours(hours(number))).toEqual(number)
    }
})
