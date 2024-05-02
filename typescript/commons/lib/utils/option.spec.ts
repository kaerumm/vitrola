import { test, expect } from 'bun:test'
import { Options } from './option'

test('Options', function () {
    expect(Options.some(0)).toEqual(0)
    expect(Options.isSome(Options.some(0))).toEqual(true)
    expect(Options.none()).toEqual(null)
    expect(Options.isNone(Options.none())).toEqual(true)
    expect(
        Options.map(Options.some(1), function (number) {
            return !!number
        })
    ).toEqual(true)
    expect(
        Options.map(Options.none(), function (number) {
            return !!number
        })
    ).toEqual(null)
    const falsyValues = [false, 0, -0, 0n, '', null, undefined, NaN]
    for (const falsy of falsyValues) {
        expect(Options.fromTruthy(falsy)).toEqual(null)
    }
})
