import { ErrorResult, Result, Results, ValueResult } from './result'

export interface TimeoutError {
    kind: 'timeout'
    time: number
}

/**
 * @param timeout Time in miliseconds
 */
export function sleep(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout))
}

type WrapResult<T> = T extends Result<any, any> ? T : Result<T, unknown>

export async function wrapRace<T extends PromiseLike<any>[]>(
    values: T
): Promise<WrapResult<Awaited<T[number]> | ErrorResult<unknown>>> {
    try {
        return (await Promise.race(values)) as WrapResult<Awaited<T[number]>>
    } catch (error: unknown) {
        return Results.error(error)
    }
}

/**
 * @param timeout Time in miliseconds
 */
export async function timeout(
    timeout: number
): Promise<ErrorResult<TimeoutError>> {
    await sleep(timeout)
    return Results.error({
        kind: 'timeout',
        time: timeout,
    })
}
