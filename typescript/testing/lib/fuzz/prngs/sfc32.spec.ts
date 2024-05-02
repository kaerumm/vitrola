import { test, expect } from 'bun:test'
import { sfc32 } from './sfc32'
import { range } from 'commons/lib/utils/range'

test('PRNG Sfc32 must always return the same values given the same seed', function () {
    for (const seed of range(0, 100)) {
        const seededPRNG = sfc32(seed)
        for (const _ of range(0, 1_000)) {
            const value = seededPRNG()
            expect(value).toMatchSnapshot()
        }
    }
})
