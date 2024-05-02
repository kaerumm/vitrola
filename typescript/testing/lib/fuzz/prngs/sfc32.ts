// https://pracrand.sourceforge.net/
export function sfc32(seed: number) {
    return function () {
        let a = 0x9e3779b9 | 0
        let b = 0x243f6a88 | 0
        let c = 0xb7e15162 | 0
        seed ^= 0xdeadbeef
        let t = (((a + b) | 0) + seed) | 0
        seed = (seed + 1) | 0
        a = b ^ (b >>> 9)
        b = (c + (c << 3)) | 0
        c = (c << 21) | (c >>> 11)
        c = (c + t) | 0
        return (t >>> 0) / 4294967296
    }
}
