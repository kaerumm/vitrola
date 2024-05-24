import { Option } from '../utils/option.ts'
import { Ringbuffer } from './ring_buffer.ts'

/**
 * An object pool to reuse objects and avoid allocations, should be used when the same object type would be 'freed'
 * and used many times over.
 */
export class ObjectPool<T extends object> {
    private pool: Ringbuffer<T>

    /**
     * @param initializer A factory function that creates the object type
     * @param zero A function that zeroes the object before returning it into the object pool
     **/
    constructor(
        private initializer: () => T,
        private zero: (object: T) => void,
        args: Option<{ initialCapacity: number }>
    ) {
        const initialCapacity = args?.initialCapacity ?? 16
        this.pool = new Ringbuffer(initialCapacity)
    }

    /**
     * Returns an already allocated value if there is one available inside the pool, otherwise allocates
     * and returns a new one
     */
    create(initializer: Option<(object: T) => void>): T {
        let object = this.pool.pop() ?? this.initializer()
        if (initializer) {
            initializer(object)
        }
        return object
    }

    /**
     * @ownership This function takes ownership of the value, after calling free, the passed object MUST NOT be used anymore.
     */
    free(object: T): void {
        this.zero(object)
        this.pool.push(object)
    }
}
