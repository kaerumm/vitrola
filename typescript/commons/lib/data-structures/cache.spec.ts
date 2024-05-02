import { test, expect, spyOn } from 'bun:test'
import { GenericCache } from './cache.ts'
import { sleep } from 'commons/lib/utils/time.ts'

test('Cache', async function () {
    const clearIntervalSpy = spyOn(global, 'clearInterval')
    {
        using cache = new GenericCache<string>({
            ttl: 50,
            expiryCheckPeriod: 100,
        })
        cache.set('key', 'value')
        expect(cache.get('key')).toEqual('value')
        // Can't use fake timers with bun yet and I don't think changing to jest is worth over this, so we just wait for the check to run...
        // This sucks
        await sleep(190)
        expect(cache.get('key')).toEqual(null)
        cache.set('key', 'value')
        expect(cache.get('key')).toEqual('value')
        cache.delete('key')
        expect(cache.get('key')).toEqual(null)
    }
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
})
