type None = null
export type Option<T> = T | None

export class Options {
    private constructor() {}

    static some<T>(value: T): Option<T> {
        return value as Option<T>
    }

    static none<T>(): Option<T> {
        return null as Option<T>
    }

    static fromTruthy<T>(value?: T): Option<T> {
        if (!value) {
            return null
        }
        return value
    }

    static isSome<T>(option: Option<T>): option is T {
        return option !== null
    }

    static isNone<T>(option: Option<T>): option is None {
        return option === null
    }

    static map<T, U>(option: Option<T>, mapper: (value: T) => U): Option<U> {
        if (this.isNone(option)) {
            return null
        }
        return mapper(option)
    }
}
