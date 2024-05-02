export function assert(assertion: boolean, msg: string) {
    if (!assertion) {
        throw new Error(`Assertion error: ${msg}`)
    }
}

export type BotError = Fatal | Warning

export interface Fatal {
    kind: 'fatal'
    message: string
}

export interface Warning {
    kind: 'warning'
    message: string
}

export function unreachable(message?: string): never {
    throw new Error(message)
}
