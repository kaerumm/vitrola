export type Range = [from: number, to: number]

/**
 * @param from Inclusive
 * @param to Not inclusive
 *
 *  [from, to)
 */
export function range(
    from: number,
    to: number,
    step: number = 1,
    inclusive = false
) {
    const direction = (to - from) / Math.abs(to - from)
    if (inclusive) {
        to = to + direction
    }
    if (direction > 0) {
        return positiveDirection(from, to, direction * step)
    }
    return negativeDirection(from, to, direction * step)
}

function* negativeDirection(from: number, to: number, step: number) {
    for (let i = from; i > to; i += step) {
        yield i
    }
}

function* positiveDirection(from: number, to: number, step: number) {
    for (let i = from; i < to; i += step) {
        yield i
    }
}
