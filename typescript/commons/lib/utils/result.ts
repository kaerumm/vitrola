import { Options, type Option } from './option'

export type ValueResult<T> = T extends void ? undefined : T
export interface ErrorResult<E> {
    error: E
}
export type Result<T, E = Error> = ValueResult<T> | ErrorResult<E>

export type NotError<T> = T extends ErrorResult<any> ? never : T

export class Results {
    private constructor() {}

    static wrapError<T>(fn: () => T): Result<T, unknown> {
        try {
            return fn() as ValueResult<T>
        } catch (error: unknown) {
            return { error }
        }
    }

    static async wrapErrorAsync<T>(
        fn: () => Promise<T>
    ): Promise<Result<T, unknown>> {
        try {
            return (await fn()) as ValueResult<T>
        } catch (error: unknown) {
            return { error }
        }
    }

    static error<E>(error: E): ErrorResult<E> {
        return { error }
    }

    static ok<T>(value: ValueResult<T>): ValueResult<T> {
        return value
    }

    static isOk<T>(result: Result<T, any>): result is ValueResult<T> {
        return !this.isErr(result)
    }

    static isErr<E>(result: Result<any, E>): result is ErrorResult<E> {
        return !!result && typeof result === 'object' && 'error' in result
    }

    static map<T, E, U>(
        result: Result<T, E>,
        mapper: (result: T) => U
    ): Result<U, E> {
        if (this.isOk(result)) {
            return mapper(result as T) as Result<U, E>
        }
        return result as ErrorResult<E>
    }

    static orElse<T>(result: Result<T, any>, or: T): T {
        if (this.isOk(result)) {
            return result as T
        }
        return or
    }

    static optionErr<E>(result: Result<any, E>) {
        return this.map(result, (result) => {
            if (this.isErr(result)) {
                return Options.some(result.error)
            }
            return Options.none()
        })
    }

    static optionOk<T>(result: Result<T, any>): Option<T> {
        if (this.isOk(result)) {
            return Options.some(result)
        }
        return Options.none()
    }
}
