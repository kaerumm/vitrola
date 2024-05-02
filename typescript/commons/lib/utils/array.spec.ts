import { describe, expect, test } from '@jest/globals'
import { binarySearch, enumerated } from './array'

describe('Array', function () {
    describe('Binary search', function () {
        test('Zero length array', function () {
            const array: number[] = []
            expect(binarySearch(array, 0)).toBe(null)
        })

        test('Even length array', function () {
            let array = [0, 1]
            expect(binarySearch(array, 0)).toBe(0)
            expect(binarySearch(array, 1)).toBe(1)
            expect(binarySearch(array, 2)).toBe(null)
            array = [0, 1, 2, 3]
            expect(binarySearch(array, 0)).toBe(0)
            expect(binarySearch(array, 1)).toBe(1)
            expect(binarySearch(array, 2)).toBe(2)
            expect(binarySearch(array, 3)).toBe(3)
            expect(binarySearch(array, 4)).toBe(null)
        })

        test('Odd length array', function () {
            let array = [0]
            expect(binarySearch(array, 0)).toBe(0)
            expect(binarySearch(array, 1)).toBe(null)
            array = [0, 1, 2]
            expect(binarySearch(array, 0)).toBe(0)
            expect(binarySearch(array, 1)).toBe(1)
            expect(binarySearch(array, 2)).toBe(2)
            expect(binarySearch(array, 3)).toBe(null)
        })
    })

    test('Enumerated', function () {
        let values = []
        for (const pair of enumerated([1, 2, 3, 4])) {
            values.push(pair)
        }
        expect(values).toEqual([
            [1, 0],
            [2, 1],
            [3, 2],
            [4, 3],
        ])
    })
})
