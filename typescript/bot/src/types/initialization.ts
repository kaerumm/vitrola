import type { Result } from '../../../commons/lib/utils/result'

export interface AsyncInitializer<T, E> {
    initialize(...args: any[]): Promise<Result<T, E>>
}
