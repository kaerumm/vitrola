import type { locales } from '../../locales'
import type { modules } from '../../locales/base'
import type { Equal } from '../types/utils'

/**
 * This type checks if the locales break the two following constraints
 *
 * 1. The locale SHOULD have the same locale entries as the base locale
 * 2. The locale MUST NOT have locale entries that the base locale does not have.
 */
type ValidateLocale<Locale extends object> = BaseLocale extends Locale
    ? true
    : false

type ValidateLocales = {
    [Key in keyof typeof locales]: ValidateLocale<(typeof locales)[Key]>
}

export type AllLocalesAreValid = Equal<
    ValidateLocales[keyof ValidateLocales],
    true
>

export type AvailableLocales = keyof typeof locales | 'en_us'
export type BaseLocale = typeof modules
