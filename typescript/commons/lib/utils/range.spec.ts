import { describe, test, expect } from '@jest/globals'
import { range } from './range'

describe('Range', function () {
    test('Positive direction', function () {
        const rng = range(0, 5)
        expect(rng.next().value).toEqual(0)
        expect(rng.next().value).toEqual(1)
        expect(rng.next().value).toEqual(2)
        expect(rng.next().value).toEqual(3)
        expect(rng.next().value).toEqual(4)
        expect(rng.next().done).toEqual(true)
    })

    test('Negative direction', function () {
        const rng = range(5, 0)
        expect(rng.next().value).toEqual(5)
        expect(rng.next().value).toEqual(4)
        expect(rng.next().value).toEqual(3)
        expect(rng.next().value).toEqual(2)
        expect(rng.next().value).toEqual(1)
        expect(rng.next().done).toEqual(true)
    })

    test('Custom step positive direction', function () {
        const rng = range(0, 1, 0.25)
        expect(rng.next().value).toBeCloseTo(0)
        expect(rng.next().value).toBeCloseTo(0.25)
        expect(rng.next().value).toBeCloseTo(0.5)
        expect(rng.next().value).toBeCloseTo(0.75)
        expect(rng.next().done).toEqual(true)
    })

    test('Custom step negative direction', function () {
        const rng = range(1, 0, 0.25)
        expect(rng.next().value).toBeCloseTo(1)
        expect(rng.next().value).toBeCloseTo(0.75)
        expect(rng.next().value).toBeCloseTo(0.5)
        expect(rng.next().value).toBeCloseTo(0.25)
        expect(rng.next().done).toEqual(true)
    })

    test('Inclusive positive direction', function () {
        const rng = range(0, 5, 1, true)
        expect(rng.next().value).toEqual(0)
        expect(rng.next().value).toEqual(1)
        expect(rng.next().value).toEqual(2)
        expect(rng.next().value).toEqual(3)
        expect(rng.next().value).toEqual(4)
        expect(rng.next().value).toEqual(5)
        expect(rng.next().done).toEqual(true)
    })

    test('Inclusive Negative direction', function () {
        const rng = range(5, 0, 1, true)
        expect(rng.next().value).toEqual(5)
        expect(rng.next().value).toEqual(4)
        expect(rng.next().value).toEqual(3)
        expect(rng.next().value).toEqual(2)
        expect(rng.next().value).toEqual(1)
        expect(rng.next().value).toEqual(0)
        expect(rng.next().done).toEqual(true)
    })
})
