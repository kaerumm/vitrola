import { unreachable } from './error'
import type { Option } from './option'

/**
 * @param array Array must be ordered from the lowest to the highest
 */
export function binarySearch(
    array: readonly number[],
    target: number
): Option<number> {
    if (array.length === 0) {
        return null
    }
    let low = 0
    let high = array.length - 1
    let mid: number
    do {
        mid = Math.floor((high + low) / 2)
        if (array[mid] === target) {
            return mid
        }
        if (target < array[mid]) {
            high = mid - 1
        } else {
            low = mid + 1
        }
    } while (mid !== low && mid !== high)
    return null
}

/**
 * @param array Array must be ordered from the lowest to the highest
 * @param bias Whether to prefer the closest value that is lower than the target or the closest value that is
 * higher than target
 *
 * @returns The closest index of the value with the closest value to target or the index of the target value, if it
 * is present in the array
 */
export function binarySearchClosest(
    array: readonly number[],
    target: number,
    bias: 'high' | 'low'
): Option<number> {
    if (array.length === 0) {
        return null
    }
    let low = 0
    let high = array.length - 1
    if (target <= array[low]) {
        return low
    }
    if (target >= array[high]) {
        return high
    }
    let mid: number
    // The iteration limit is actually log2(array.length) but taking a log is needlessly expensive so we use
    // the length as the bound to avoid infinite loops
    for (let iter_limit = 0; iter_limit < array.length; iter_limit++) {
        mid = Math.floor((high + low) / 2)
        if (array[mid] === target) {
            return mid
        }
        if (target < array[mid]) {
            high = mid
        } else {
            low = mid
        }
        if (high - low <= 1) {
            if (array[high] === target) {
                return high
            }
            if (array[low] === target) {
                return low
            }
            return bias === 'low' ? low : high
        }
    }
    unreachable(
        'We should never need the length of the array iterations to do a binary search'
    )
}

export function* enumerated<T>(array: T[]): Generator<[T, number]> {
    for (let index = 0; index < array.length; index++) {
        yield [array[index], index]
    }
}
