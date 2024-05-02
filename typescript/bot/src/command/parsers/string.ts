import { type Result } from 'commons/lib/utils/result.ts'
import type { ArgumentParser } from '../command_builder.ts'
import type { ParsingError } from './parsing_error.ts'

export class StringParser implements ArgumentParser<string> {
    parse(str: string): Result<string> {}
}
