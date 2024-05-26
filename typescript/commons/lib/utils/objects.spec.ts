import { test, describe, expect } from 'bun:test'
import { tryFollow } from './objects.ts'

test('tryFollow', function () {
    const rat = {
        value: 1,
        object: {
            no: 2,
        },
    }
    expect(tryFollow(rat, ['value'])).toEqual(1)
    expect(tryFollow(rat, ['object', 'no'])).toEqual(2)
    expect(tryFollow(rat, ['none'])).toEqual(null)
    expect(tryFollow(rat, ['none.none'])).toEqual(null)
})
