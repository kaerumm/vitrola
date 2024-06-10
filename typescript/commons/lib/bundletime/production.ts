// This should be imported as a bun macro and used with an if statement.
export function production() {
    return process.env['BUNDLETIME_ENV'] === 'production'
}
