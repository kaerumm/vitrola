export function onProcessExit(): Promise<void> {
    return new Promise<void>((resolve) => {
        const f = () => {
            console.log('exiting')
            resolve()
        }
        process.once('beforeExit', f)
        process.once('SIGTERM', f)
        process.once('SIGINT', f)
    })
}
