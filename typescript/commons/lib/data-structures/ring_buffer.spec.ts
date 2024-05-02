import { expect, test, describe } from '@jest/globals'
import { Ringbuffer } from './ring_buffer'
import { range } from 'commons/lib/utils/range'

describe('Ringbuffer', function () {
    test('Push', function () {
        const list = new Ringbuffer(4)
        list.push(5)
        expect(list.length).toEqual(1)
        expect(list.peek(0)).toEqual(5)
    })

    test('PushFront', function () {
        const list = new Ringbuffer(4)
        list.pushFront(5)
        expect(list.length).toEqual(1)
        expect(list.peek(0)).toEqual(5)
    })

    test('Pop', function () {
        const list = new Ringbuffer(4)
        expect(list.pop()).toEqual(null)
        expect(list.length).toEqual(0)
        list.push(5)
        expect(list.pop()).toEqual(5)
        expect(list.length).toEqual(0)
    })

    test('Shift', function () {
        const list = new Ringbuffer(4)
        expect(list.shift()).toEqual(null)
        expect(list.length).toEqual(0)
        list.pushFront(5)
        expect(list.shift()).toEqual(5)
        expect(list.length).toEqual(0)
    })

    test('Growing when pushing to the end', function () {
        const capacity = 4
        const list = new Ringbuffer(capacity)
        for (const number of range(0, 8)) {
            list.push(number)
            expect(list.length).toEqual(number + 1)
        }
        for (const number of range(7, -1)) {
            expect(list.pop()).toEqual(number)
            expect(list.length).toEqual(number)
        }
        for (const number of range(0, 8)) {
            list.push(number)
            expect(list.length).toEqual(number + 1)
        }
        for (const number of range(7, -1)) {
            expect(list.pop()).toEqual(number)
            expect(list.length).toEqual(number)
        }
    })

    test('Growing when pushing to the front', function () {
        const capacity = 4
        const list = new Ringbuffer(capacity)
        for (const number of range(0, 8)) {
            list.pushFront(number)
            expect(list.length).toEqual(number + 1)
        }
        for (const number of range(7, -1)) {
            expect(list.shift()).toEqual(number)
            expect(list.length).toEqual(number)
        }
        for (const number of range(0, 8)) {
            list.pushFront(number)
            expect(list.length).toEqual(number + 1)
        }
        for (const number of range(7, -1)) {
            expect(list.shift()).toEqual(number)
            expect(list.length).toEqual(number)
        }
    })

    test('Mixed operations', function () {
        const list = new Ringbuffer(4)
        list.push(1)
        list.pushFront(2)
        list.pushFront(3)
        expect(list.pop()).toEqual(1)
        list.push(4)
        list.push(5)
        list.pushFront(6)
        expect(list.length).toEqual(5)
        expect(list.peek(0)).toEqual(6)
        expect(list.peek(1)).toEqual(3)
        expect(list.peek(2)).toEqual(2)
        expect(list.peek(3)).toEqual(4)
        expect(list.peek(4)).toEqual(5)
        for (const _ of range(0, list.length)) {
            list.pop()
        }
        expect(list.length).toEqual(0)
        list.pushFront(1)
        expect(list.pop()).toEqual(1)
        list.pushFront(2)
        expect(list.shift()).toEqual(2)
        list.push(1)
        expect(list.pop()).toEqual(1)
        list.push(2)
        expect(list.shift()).toEqual(2)
    })
})
