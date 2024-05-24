import { describe, expect, test } from '@jest/globals'
import { binarySearch, binarySearchClosest, enumerated } from './array'
import {
    Fuzzer,
    PseudoRandomNumberGenerator,
    fuzzyTest,
    randomNumber,
} from 'testing/lib/fuzz/fuzz.ts'
import { Results } from './result'

class BinarySearchClosestFuzzer
    implements
        Fuzzer<
            [
                low: number,
                high: number,
                target: number,
                insertedTarget: boolean,
                number[],
            ]
        >
{
    fuzz(
        prng: PseudoRandomNumberGenerator
    ): [
        low: number,
        high: number,
        target: number,
        insertedTarget: boolean,
        number[],
    ] {
        const initialNumber = randomNumber(prng, -1_000_000, 1_000_000)
        const length = randomNumber(prng, 0, 100)
        const array = [initialNumber]
        let low = -Infinity
        let high = Infinity
        let selectedNumber = Infinity
        let insertedTarget = false
        while (array.length < length) {
            const delta = randomNumber(prng, 0, 5)
            let next = array[array.length - 1] + delta
            array.push(next)
        }
        const selectedNumberIndex = Math.floor(
            randomNumber(prng, 0, array.length)
        )
        const random = randomNumber(prng, 0, 100)
        if (random <= 33) {
            // selectedNumber is low idx
            low = selectedNumberIndex
            high = Math.min(selectedNumberIndex + 1, array.length - 1)
            selectedNumber = (array[high] + array[low]) / 2
        } else if (random >= 33 && random <= 66) {
            // selectedNumber is high idx
            high = selectedNumberIndex
            low = Math.max(high - 1, 0)
            selectedNumber = (array[high] + array[low]) / 2
        } else {
            // selectedNumber is within the array
            insertedTarget = true
            selectedNumber = array[selectedNumberIndex]
        }
        return [low, high, selectedNumber, insertedTarget, array]
    }
}

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

    describe('Binary search closest', function () {
        test('Zero length array', function () {
            const array: number[] = []
            expect(binarySearchClosest(array, 0, 'low')).toBe(null)
        })

        test('Even length array with the target', function () {
            let array = [0, 1]
            expect(binarySearchClosest(array, 0, 'low')).toBe(0)
            expect(binarySearchClosest(array, 1, 'low')).toBe(1)
            array = [0, 1, 2, 3]
            expect(binarySearchClosest(array, 0, 'low')).toBe(0)
            expect(binarySearchClosest(array, 1, 'low')).toBe(1)
            expect(binarySearchClosest(array, 2, 'low')).toBe(2)
            expect(binarySearchClosest(array, 3, 'low')).toBe(3)
        })

        test('Odd length array with the target', function () {
            let array = [0]
            expect(binarySearchClosest(array, 0, 'low')).toBe(0)
            array = [0, 1, 2]
            expect(binarySearchClosest(array, 0, 'low')).toBe(0)
            expect(binarySearchClosest(array, 1, 'low')).toBe(1)
            expect(binarySearchClosest(array, 2, 'low')).toBe(2)
        })

        test('Even length array without the target', function () {
            let array = [0]
            expect(binarySearchClosest(array, 1, 'low')).toBe(0)
            expect(binarySearchClosest(array, 2, 'low')).toBe(0)
            array = [0, 2, 4, 8]
            expect(binarySearchClosest(array, 1, 'low')).toBe(0)
            expect(binarySearchClosest(array, 1, 'high')).toBe(1)
            expect(binarySearchClosest(array, 3, 'low')).toBe(1)
            expect(binarySearchClosest(array, 3, 'high')).toBe(2)
        })

        test('Odd length array without the target', function () {
            let array = [0]
            expect(binarySearchClosest(array, 1, 'low')).toBe(0)
            expect(binarySearchClosest(array, 2, 'low')).toBe(0)
            array = [0, 2, 4]
            expect(binarySearchClosest(array, 1, 'low')).toBe(0)
            expect(binarySearchClosest(array, 1, 'high')).toBe(1)
            expect(binarySearchClosest(array, 3, 'low')).toBe(1)
            expect(binarySearchClosest(array, 3, 'high')).toBe(2)
        })

        test('Fuzzy test for unexpected crashes', function () {
            expect(
                fuzzyTest(
                    new BinarySearchClosestFuzzer(),
                    ([low, high, target, insertedTarget, array]) => {
                        if (insertedTarget) {
                            const low = binarySearchClosest(
                                array,
                                target,
                                'low'
                            )
                            const high = binarySearchClosest(
                                array,
                                target,
                                'high'
                            )
                            expect(
                                low != null &&
                                    low === high &&
                                    target === array[low]
                            ).toBe(true)
                        } else {
                            expect(
                                binarySearchClosest(array, target, 'low')
                            ).toBe(low)
                            expect(
                                binarySearchClosest(array, target, 'high')
                            ).toBe(high)
                        }
                    },
                    { iterations: 100_000 }
                )
            ).toEqual(Results.ok(undefined))
        })
    })

    test('Enumerated', function () {
        let values: [number, number][] = []
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
