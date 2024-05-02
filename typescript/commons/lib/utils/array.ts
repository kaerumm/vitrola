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

export function* enumerated<T>(array: T[]): Generator<[T, number]> {
    for (let index = 0; index < array.length; index++) {
        yield [array[index], index]
    }
}
