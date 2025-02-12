import { describe, test, expect } from 'bun:test'
import { Cursor } from './cursor'

describe('Cursor', function () {
    test('Properly ends when used on a while loop', function () {
        const cursor = new Cursor([1, 2, 3])
        let next
        while ((next = cursor.next())) {
            expect(next).toBeTruthy()
        }
    })

    test('Next', function () {
        const cursor = new Cursor([1, 2, 3])
        expect(cursor.next()).toBe(1)
        expect(cursor.next()).toBe(2)
        expect(cursor.next()).toBe(3)
        expect(cursor.next()).toBe(null)
        expect(cursor.next()).toBe(null)
    })

    test('Peek', function () {
        const cursor = new Cursor([1, 2, 3])
        expect(cursor.peek(0)).toBe(1)
        expect(cursor.peek(0)).toBe(1)
        expect(cursor.peek(1)).toBe(2)
        expect(cursor.next()).toBe(1)
        expect(cursor.peek(0)).toBe(2)
        expect(cursor.peek(0)).toBe(2)
        expect(cursor.peek(1)).toBe(3)
        expect(cursor.next()).toBe(2)
        expect(cursor.peek(0)).toBe(3)
        expect(cursor.peek(0)).toBe(3)
        expect(cursor.peek(1)).toBe(null)
        expect(cursor.next()).toBe(3)
        expect(cursor.peek(0)).toBe(null)
        expect(cursor.peek(0)).toBe(null)
        expect(cursor.peek(1)).toBe(null)
        expect(cursor.next()).toBe(null)
    })

    test('Seek', function () {
        const cursor = new Cursor([1, 2, 3])
        cursor.seek(2)
        expect(cursor.peek(0)).toEqual(3)
        cursor.seek(0)
        expect(cursor.peek(0)).toEqual(1)
    })

    test('Prev', function () {
        const cursor = new Cursor([1, 2, 3])
        cursor.seek(2)
        expect(cursor.prev()).toEqual(3)
        expect(cursor.prev()).toEqual(2)
        expect(cursor.prev()).toEqual(1)
        expect(cursor.prev()).toEqual(null)
    })

    test('SeekToLast', function () {
        const cursor = new Cursor([1, 2, 3]).seekToLast()
        expect(cursor.prev()).toEqual(3)
        expect(cursor.prev()).toEqual(2)
        expect(cursor.prev()).toEqual(1)
        expect(cursor.prev()).toEqual(null)
    })
})
