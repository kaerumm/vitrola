import { Cursor } from 'commons/lib/data-structures/cursor.ts'
import {
    LazyLocale,
    LocalizationManager,
} from '../../localization/localization_manager.ts'
import type { Result } from 'commons/lib/utils/result.ts'
import type { ArgumentParser } from '../command_builder.ts'

export class FlagParser implements ArgumentParser<boolean> {
    parse(_cursor: Cursor<string>): Result<boolean, string> {
        return true
    }

    hint(): LazyLocale<any> {
        return LocalizationManager.lazy('interpreter.flagParserHint', undefined)
    }
}

export const SingletonFlagParser = new FlagParser()
