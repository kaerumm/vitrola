export function paddingFor(str: string, offset: number): string {
    const padding = ''.padStart(str.length + offset)
    return padding
}

/**
 * Terrible name, think of something better later.
 *
 * Negative limits are the same as a limit of 0.
 *
 * Takes a string and limits it's length to `limit`, if a string is larger than the limit
 * the resulting string will be the concatenation of str[0..limit/2,str.length - limit/2..]
 * otherwise the original string is returned
 *
 * @example
 * const str = centered_limit('example', 4)
 * ^^^ => 'ex...le'
 *
 * @param limit Must be an positive integer value, non-positive numbers are clamped to 0
 * and non-integer numbers are Math.floored.
 */
export function centeredLimit(str: string, limit: number): string {
    limit = Math.max(0, Math.floor(limit))
    if (str.length <= limit) {
        return str
    }
    if (limit <= 0) {
        return ''
    }
    if (limit === 1) {
        return str[0]
    }
    // the start gets more characters
    const startLength = Math.ceil(limit / 2)
    const endLength = limit - startLength
    const start = str.slice(0, startLength)
    const end = str.slice(str.length - endLength)
    return `${start}...${end}`
}
