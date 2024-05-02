import { Ringbuffer } from './ring_buffer.ts'

/**
 * An object pool to reuse objects and avoid allocations, should be used when the same object type would be 'freed'
 * and used many times over.
 */
export class ObjectPool<T> {
    private pool: Ringbuffer<T>

    /**
     * @param ctor A factory function that creates the object type
     * @param zero A function that takes the object and zeroes it's field's values
     */
    constructor(
        private ctor: () => T,
        private zero: (object: T) => void,
        args?: { initialCapacity: number }
    ) {
        const initialCapacity = args?.initialCapacity ?? 16
        this.pool = new Ringbuffer(initialCapacity)
    }

    /**
     * Returns an already allocated value if there is one available inside the pool, otherwise allocates
     * and returns a new one
     */
    create(): T {
        let object = this.pool.pop() ?? this.ctor()
        this.zero(object)
        return object
    }

    /**
     * @ownership This function takes ownership of the value, after calling free, the passed object MUST NOT be used anymore.
     */
    free(object: T): void {
        this.pool.push(object)
    }
}
