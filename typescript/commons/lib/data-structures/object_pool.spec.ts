import { expect, test } from '@jest/globals'
import { ObjectPool } from './object_pool'

interface Object {
    a: number
}

test('ObjectPool', function () {
    const pool = new ObjectPool<Object>(
        () => ({ a: 0 }),
        (o) => (o.a = 0)
    )
    const object = pool.create()
    expect(object.a).toEqual(0)
    object.a = 1
    pool.free(object)
    const newObject = pool.create()
    expect(newObject).toBe(object)
    expect(newObject.a).toEqual(0)
})
