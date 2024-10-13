import { Ringbuffer } from '../data-structures/ring_buffer'

export class AsyncDisposableStack implements AsyncDisposable {
    private disposables: Ringbuffer<AsyncDisposable> = new Ringbuffer()

    use(disposable: AsyncDisposable) {
        this.disposables.push(disposable)
    }

    async [Symbol.asyncDispose](): Promise<void> {
        let disposable: AsyncDisposable | null = null
        while ((disposable = this.disposables.shift())) {
            await disposable[Symbol.asyncDispose]()
        }
    }
}
