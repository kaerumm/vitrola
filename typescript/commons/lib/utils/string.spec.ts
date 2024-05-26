import { test, expect } from 'bun:test'
import { centeredLimit, paddingFor } from './string.ts'

test('centeredLimit', function () {
    // even limit should divide equally between both parts
    expect(centeredLimit('example', 4)).toEqual('ex...le')
    // odd limit should give more characters to the start
    expect(centeredLimit('example', 5)).toEqual('exa...le')
    // negative limit should be clamped to 0
    expect(centeredLimit('example', -10)).toEqual('')
    // zero limit should return an empty string
    expect(centeredLimit('example', 0)).toEqual('')
    // A limit of same size or bigger must return the original string
    expect(centeredLimit('example', 7)).toEqual('example')
    expect(centeredLimit('example', 10)).toEqual('example')
    // limit of one should return the starting character
    expect(centeredLimit('example', 1)).toEqual('e')
    // limit of two and above should return start and end concatenated by ...
    expect(centeredLimit('example', 2)).toEqual('e...e')
    // empty string should return an empty string regardless of the limit
    expect(centeredLimit('', 2)).toEqual('')
})

test('paddingFor', function () {
    expect(paddingFor('12345678', 0)).toEqual('        ')
    expect(paddingFor('12345678', -1)).toEqual('       ')
})
