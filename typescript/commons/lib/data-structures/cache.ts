import { seconds } from 'commons/lib/utils/time'
import { ObjectPool } from './object_pool'

interface CacheNode<T> {
    timestamp: number
    value?: T
}

interface CacheOptions {
    // How much time in miliseconds it takes to expire an entry that has not been accessed, defaults to 1 minute
    ttl: number
    // How frequently should the cache check for expired entries, defaults to 10 seconds
    expiryCheckPeriod: number
}

const defaultCacheOptions: CacheOptions = {
    ttl: seconds(60),
    expiryCheckPeriod: seconds(10),
}

/**
 * A cache implementation, attempts to clear entries every 10 seconds, which means minimum ttl is 10s.
 *
 * This class creates an interval at construction time, so it MUST be disposed of when an instance
 * of it is no longer going to be used.
 *
 * ```
 * using cache = new GenericCache()
 * ^ This will take care of disposing of the cache when it goes out of scope
 * ```
 */
export class GenericCache<T> implements Disposable {
    private options: CacheOptions
    private interval: Timer | null
    private cacheNodeObjectPool = new ObjectPool<CacheNode<T>>(
        () => ({ value: undefined, timestamp: 0 }),
        (node) => {
            node.value = undefined
            node.timestamp = 0
        }
    )
    // Map maintains insertion order, we exploit that to keep older entries at the start of the Map
    // such that when we iterate over it we iterate starting from the oldest to the youngest
    private values = new Map<string, CacheNode<T>>()

    constructor(opts?: Partial<CacheOptions>) {
        this.options = { ...defaultCacheOptions, ...opts }
        this.interval = setInterval(
            this.clear.bind(this),
            this.options.expiryCheckPeriod
        )
    }

    private clear() {
        const now = Date.now()
        const nodesToRemove = []
        for (const entry of this.values.entries()) {
            if (now < entry[1].timestamp) {
                break
            }
            nodesToRemove.push(entry)
        }
        for (const entry of nodesToRemove) {
            this.cacheNodeObjectPool.free(entry[1])
            this.values.delete(entry[0])
        }
    }

    private nextExpirationTimestamp() {
        return Date.now() + this.options.ttl
    }

    get(key: string): T | null {
        const node = this.values.get(key)
        if (node) {
            // We reinsert the element to put it at the very end of iteration order,
            // thus keeping the ordering of oldest to youngest
            this.values.delete(key)
            this.values.set(key, node)
        }
        return node?.value ?? null
    }

    set(key: string, value: T): void {
        const node = this.cacheNodeObjectPool.create()
        node.value = value
        node.timestamp = this.nextExpirationTimestamp()
        this.values.set(key, node)
    }

    delete(key: string): boolean {
        const node = this.values.get(key)
        if (node) {
            this.cacheNodeObjectPool.free(node)
        }
        return this.values.delete(key)
    }

    [Symbol.dispose](): void {
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
        }
    }
}
