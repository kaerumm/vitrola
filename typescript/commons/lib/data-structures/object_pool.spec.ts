import { expect, test } from '@jest/globals'
import { ObjectPool } from './object_pool'

interface Object {
    a: number
}

test('ObjectPool', function () {
    const pool = new ObjectPool<Object>(
        () => ({
            a: 0,
        }),
        (object) => (object.a = 0),
        null
    )
    const object = pool.create(null)
    expect(object.a).toEqual(0)
    object.a = 1
    pool.free(object)
    const newObject = pool.create(null)
    expect(newObject).toBe(object)
    expect(newObject.a).toEqual(0)
    const initializedObject = pool.create((object) => (object.a = 2))
    expect(initializedObject.a).toEqual(2)
    pool.free(initializedObject)
    const initializedReusedObject = pool.create((object) => (object.a = 2))
    expect(initializedReusedObject.a).toEqual(2)
    expect(initializedReusedObject).toBe(initializedObject)
})
