import { expect, test } from 'bun:test'
import { assert } from './error'

test('Assert', function () {
    expect(() => assert(false, 'assert')).toThrow('assert')
    expect(() => assert(true, 'assert')).not.toThrow('assert')
})
