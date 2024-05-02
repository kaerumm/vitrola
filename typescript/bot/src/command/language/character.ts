import { binarySearch } from 'commons/lib/utils/array'
import { range } from 'commons/lib/utils/range'
import { numberIncreasing } from 'commons/lib/utils/sort'
import type { Option } from 'commons/lib/utils/option'

export const CharacterCodes = {
    // Line breakers
    LineFeed: 0x000a,
    LineTabulation: 0x000b,
    FormFeed: 0x000c,
    CarriageReturn: 0x000d,
    NextLine: 0x0085,
    LineSeparator: 0x2028,
    ParagraphSeparator: 0x2029,
    // Whitespace
    CharacterTabulation: 0x0009,
    ASCIISpace: 0x0020,
    NonbreakingSpace: 0x00a0,
    OghamSpaceMark: 0x1680,
    EnQuad: 0x2000,
    HairSpace: 0x200a,
    MathematicalSpace: 0x205f,
    IdeographicSpace: 0x3000,
}

export const MAX_UNICODE_CODEPOINT = 0x10ffff

// Reference: - https://en.wikipedia.org/wiki/Whitespace_character

export const whitespaces: Readonly<number[]> = [
    CharacterCodes.CharacterTabulation,
    CharacterCodes.ASCIISpace,
    CharacterCodes.NonbreakingSpace,
    CharacterCodes.OghamSpaceMark,
    ...Array.from(
        range(CharacterCodes.EnQuad, CharacterCodes.HairSpace, 1, true)
    ),
    CharacterCodes.MathematicalSpace,
    CharacterCodes.IdeographicSpace,
].sort(numberIncreasing)

export const lineBreakers: Readonly<number[]> = [
    CharacterCodes.LineFeed,
    CharacterCodes.LineTabulation,
    CharacterCodes.FormFeed,
    CharacterCodes.CarriageReturn,
    CharacterCodes.NextLine,
    CharacterCodes.LineSeparator,
    CharacterCodes.ParagraphSeparator,
].sort(numberIncreasing)

// Whitespace tagged characters that are not also tagged as definitive line breakers
export function isUnicodeWhitespace(character: Option<string>): boolean {
    if (!character) {
        return false
    }
    return binarySearch(whitespaces, character.codePointAt(0)!) !== null
}

// Whitespace tagged characters that are also tagged as definitive line breakers
export function isUnicodeLineBreak(character: Option<string>): boolean {
    if (!character) {
        return false
    }
    return binarySearch(lineBreakers, character.codePointAt(0)!) !== null
}

// Reserved characters are characters with syntax significance
export const reservedCharacters: Readonly<number[]> = Array.from(
    '()-+;/*!=<>&|\'"'
)
    .map((c) => c.codePointAt(0)!)
    .sort(numberIncreasing)

export function isReservedCharacter(character: Option<string>): boolean {
    if (!character) {
        return false
    }
    return binarySearch(reservedCharacters, character.codePointAt(0)!) !== null
}

// A special character is a null (EOF) character, a reserved symbol, a whitespace or a line break
export function isSpecialCharacter(character: Option<string>): boolean {
    if (!character) {
        return true
    }
    return (
        isReservedCharacter(character) ||
        isUnicodeLineBreak(character) ||
        isUnicodeWhitespace(character)
    )
}
