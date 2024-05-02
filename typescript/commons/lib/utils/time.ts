export function seconds(seconds: number): number {
    return seconds * 1000
}

export function minutes(minutes: number): number {
    return minutes * seconds(60)
}

export function hours(hours: number): number {
    return hours * minutes(60)
}

export function intoSeconds(millis: number): number {
    return millis / 1000
}

export function intoMinutes(millis: number): number {
    return intoSeconds(millis) / 60
}

export function intoHours(millis: number): number {
    return intoMinutes(millis) / 60
}

export async function sleep(t: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, t))
}
