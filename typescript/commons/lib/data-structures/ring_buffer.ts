import { assert } from 'commons/lib/utils/error'
/**
 * A buffer with amortized O(1) cost for insertions and O(1) cost for removes from either the start or the end
 *
 * An insertion might trigger a capacity grow, if the length becomes equal to the current capacity. In that case
 * the cost will be an Array allocation and a linear copy of the old backing array into the new one.
 */
export class Ringbuffer<T> {
    private backingArray = new Array(8)
    private tail = 2
    private head = 2
    private _length = 0

    constructor(capacity?: number) {
        if (capacity) {
            this.backingArray = new Array(capacity)
            this.tail = Math.floor(capacity / 4)
            this.head = this.tail
        }
    }

    get length() {
        return this._length
    }

    private grow() {
        const newArray = new Array(this.backingArray.length * 2)
        // We center the old values in the new array
        const centerPoint = Math.floor(newArray.length / 4)
        for (let index = 0; index < this.length; index++) {
            newArray[centerPoint + index] =
                this.backingArray[
                    (this.head + index) % this.backingArray.length
                ]
        }
        this.head = centerPoint
        this.tail = centerPoint + this.length - 1
        this.backingArray = newArray
    }

    private checkGrow() {
        if (this._length === this.backingArray.length) {
            this.grow()
        }
    }

    /**
     * Inserts an element at the tail of the buffer, if the buffer becomes full it then grows to double the current size.
     *
     * @complexity
     * Amortized O(1)
     * Worst case O(n) due to an array allocation and copy
     */
    push(value: T) {
        assert(
            this._length < this.backingArray.length,
            'We grow after pushing to the buffer, so we must always have space before doing a push'
        )
        this.tail = (this.tail + 1) % this.backingArray.length
        this.backingArray[this.tail] = value
        if (this._length === 0) {
            this.head = this.tail
        }
        this._length += 1
        this.checkGrow()
    }

    /**
     * Inserts an element at the head of the buffer, if the buffer becomes full it then grows to double the current size.
     *
     * @complexity
     * Amortized O(1)
     * Worst case O(n) due to an array allocation and copy
     */
    pushFront(value: T) {
        assert(
            this._length < this.backingArray.length,
            'We grow after pushing to the buffer, so we must always have space before doing a push'
        )
        this.head = (this.head - 1) % this.backingArray.length
        this.backingArray[this.head] = value
        if (this._length === 0) {
            this.tail = this.head
        }
        this._length += 1
        this.checkGrow()
    }

    /**
     * Removes and returns the last element starting from the head of the buffer
     *
     * @complexity
     * O(1)
     */
    pop(): T | null {
        if (this._length === 0) {
            return null
        }
        const value = this.backingArray[this.tail]
        this.backingArray[this.tail] = null
        this.tail = (this.tail - 1) % this.backingArray.length
        this._length -= 1
        return value
    }

    /**
     * Removes and returns the first element starting from the head of the buffer
     *
     * @complexity
     * O(1)
     */
    shift(): T | null {
        if (this._length === 0) {
            return null
        }
        const value = this.backingArray[this.head]
        this.backingArray[this.head] = null
        this.head = (this.head + 1) % this.backingArray.length
        this._length -= 1
        return value
    }

    /**
     * @param pos Offset to peek from, peeking out of bounds returns null
     *
     * @complexity
     * O(1)
     */
    peek(pos: number): T | null {
        if (pos < 0 || pos >= this._length) {
            return null
        }
        return this.backingArray[(this.head + pos) % this.backingArray.length]
    }
}
