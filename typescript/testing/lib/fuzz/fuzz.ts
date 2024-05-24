import { Option } from 'commons/lib/utils/option'
import { range } from 'commons/lib/utils/range'
import { Result, Results } from 'commons/lib/utils/result'
import { sfc32 } from './prngs/sfc32'

export type PseudoRandomNumberGenerator = () => number

/**
 * A fuzzer's output must be deterministic, given the same seeded prng it must return the same result.
 * This constraint exists so that fuzzy tests are easily reproducible.
 */
export interface Fuzzer<T> {
    /*
     * @param random is a number between 0..1 generated by a seeded RNG
     */
    fuzz(prng: PseudoRandomNumberGenerator): T
}

const defaultFuzzyTestOptions = {
    iterations: 1_000_000,
    seed: null as Option<number>,
}

export interface FuzzyError {
    seed: number
    error: unknown
    options: typeof defaultFuzzyTestOptions
}
export function fuzzyTest<T>(
    fuzzer: Fuzzer<T>,
    fn: (value: T) => void,
    opts: Option<Partial<typeof defaultFuzzyTestOptions>>
): Result<void, FuzzyError> {
    const options = {
        ...defaultFuzzyTestOptions,
        ...opts,
    }
    // For now, we use current time as seed
    const seed = options.seed ?? Date.now()
    const prng = sfc32(seed)
    try {
        for (const _ of range(0, options.iterations)) {
            fn(fuzzer.fuzz(prng))
        }
        return Results.ok(undefined)
    } catch (error: unknown) {
        return Results.error({ seed, options, error })
    }
}

export function randomNumber(
    prng: PseudoRandomNumberGenerator,
    from: number,
    to: number
): number {
    return from + prng() * (to - from)
}
