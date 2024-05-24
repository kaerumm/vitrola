// https://pracrand.sourceforge.net/
export function sfc32(seed: number) {
    let a = 0x9e3779b9 | 0
    let b = 0x243f6a88 | 0
    let c = 0xb7e15162 | 0
    let d = (seed ^ 0xdeadbeef) | 0
    return function () {
        let t = (((a + b) | 0) + d) | 0
        d = (d + 1) | 0
        a = b ^ (b >>> 9)
        b = (c + (c << 3)) | 0
        c = (c << 21) | (c >>> 11)
        c = (c + t) | 0
        return (t >>> 0) / 4294967296
    }
}
