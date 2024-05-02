export interface Logger {
    info(...args: any[]): void
    warn(...args: any[]): void
    error(...args: any[]): void
    debug(...args: any[]): void
}

export class ConsoleLogger implements Logger {
    constructor(private prefix: string) {}

    debug(...args: any[]): void {
        console.debug(`[${this.prefix}]`, ...args)
    }

    info(...args: any[]): void {
        console.info(`[${this.prefix}]`, ...args)
    }

    warn(...args: any[]): void {
        console.warn(`[${this.prefix}]`, ...args)
    }

    error(...args: any[]): void {
        console.error(`[${this.prefix}]`, ...args)
    }
}
