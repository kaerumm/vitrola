import { type Option } from 'commons/lib/utils/option'

export class Cursor<T> {
    private _position = 0
    constructor(private array: T extends string ? string | string[] : T[]) {}

    /**
     * The index of the current cursor position, that is, the index of the value
     * returned by the next call to next()
     */
    get position() {
        return this._position
    }

    peek(n: number): Option<T> {
        if (this._position + n >= this.array.length) {
            return null
        }
        const value = this.array[this._position + n]
        if (!value) {
            return null
        }
        return value as Option<T>
    }

    seek(position: number): void {
        this._position = position
        if (position >= this.array.length) {
            this._position = this.array.length
        }
    }

    /**
     * Returns the current value and advances the cursor, or returns null if the cursor has reached the end
     * of the backing array
     */
    next(): Option<T> {
        if (this.position >= this.array.length) {
            return null
        }
        const value = this.array[this._position]
        this._position += 1
        return value as Option<T>
    }
}
