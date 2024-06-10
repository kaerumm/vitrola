import { binarySearch } from 'commons/lib/utils/array'
import { numberIncreasing } from 'commons/lib/utils/sort'
import type { Option } from 'commons/lib/utils/option'
import {
    isDigit,
    isUnicodeLineBreak,
    isUnicodeWhitespace,
} from '../utils/character'

export const cronSymbols: Readonly<number[]> = Array.from('*,-/')
    .map((c) => c.codePointAt(0)!)
    .sort(numberIncreasing)

export function isCronSymbol(character: Option<string>): boolean {
    if (!character) {
        return false
    }
    return binarySearch(cronSymbols, character.codePointAt(0)!) !== null
}

export function isAllowedToStartCronKeyword(
    character: Option<string>
): boolean {
    if (!character) {
        return false
    }
    return (
        !isCronSymbol(character) &&
        !isDigit(character) &&
        !isUnicodeWhitespace(character) &&
        !isUnicodeLineBreak(character)
    )
}
