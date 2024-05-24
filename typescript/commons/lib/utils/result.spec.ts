import { test, expect } from 'bun:test'
import { Result, Results } from './result'
import { Options } from './option'

test('Result', function () {
    expect(Results.error({ error: true })).toEqual({ error: { error: true } })
    expect(Results.ok({ value: true })).toEqual({ value: true })
    expect(Results.isOk(Results.ok(null))).toEqual(true)
    expect(Results.isErr(Results.error(null))).toEqual(true)
    const mappedOk = Results.map(Results.ok(null), function (value) {
        return value === null
    })
    expect(mappedOk).toEqual(true)
    expect(Results.isOk(mappedOk)).toEqual(true)
    const mappedErr = Results.map(Results.error(null), function (value) {
        return value === null
    })
    expect(mappedErr).toEqual({ error: null })
    expect(Results.isErr(mappedErr)).toEqual(true)
    expect(Results.orElse(Results.error(null), true)).toEqual(true)
    expect(Results.orElse<boolean>(Results.ok(false), true)).toEqual(false)
    expect(Options.isSome(Results.optionOk(Results.ok(0)))).toEqual(true)
    expect(Options.isNone(Results.optionErr(Results.ok(0)))).toEqual(true)
    expect(Options.isSome(Results.optionOk(Results.error(0)))).toEqual(false)
    expect(Options.isNone(Results.optionErr(Results.error(0)))).toEqual(false)
    expect(
        Results.mapError(Results.error(null), function () {
            return true
        })
    ).toEqual({ error: true })
})
