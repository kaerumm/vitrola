import { Results, type Result } from 'commons/lib/utils/result.ts'
import type { ArgumentParser } from '../command_builder.ts'
import { ASTNode, ASTString } from '../language/ast.ts'
import { Cursor } from 'commons/lib/data-structures/cursor.ts'
import { PartialDSLError } from '../commander.ts'
import { LocalizationManager } from '../../localization/localization_manager.ts'

const examples = ['1', '1.2', '-1', '-4.8']

export class NumberParser implements ArgumentParser<number> {
    parse(
        cursor: Cursor<ASTNode<ASTString>>
    ): Result<[number], PartialDSLError> {
        if (!cursor.peek(0)) {
            return Results.error({
                errorMessage: LocalizationManager.lazy(
                    'interpreter',
                    'command_number_parser_missing_value',
                    undefined
                ),
                hint: LocalizationManager.lazy(
                    'interpreter',
                    'command_number_parser_missing_value_hint',
                    [examples]
                ),
            })
        }
        const literal = cursor.next()!.expression.value
        let result = parseFloat(literal)
        if (isNaN(result)) {
            result = parseInt(literal)
        }
        if (isNaN(result)) {
            return Results.error({
                errorMessage: LocalizationManager.lazy(
                    'interpreter',
                    'command_number_parser_invalid_value',
                    undefined
                ),
                hint: LocalizationManager.lazy(
                    'interpreter',
                    'command_number_parser_invalid_value_hint',
                    [examples]
                ),
            })
        }
        return [result]
    }
}
