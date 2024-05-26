import { Results, type Result } from 'commons/lib/utils/result.ts'
import type { ArgumentParser } from '../command_builder.ts'
import { ASTNode, ASTString } from '../language/ast.ts'
import { Cursor } from 'commons/lib/data-structures/cursor.ts'
import { PartialDSLError } from '../commander.ts'
import { LocalizationManager } from '../../localization/localization_manager.ts'

export class StringParser implements ArgumentParser<string> {
    parse(
        cursor: Cursor<ASTNode<ASTString>>
    ): Result<[string], PartialDSLError> {
        if (cursor.peek(0)) {
            return [cursor.next()!.expression.value]
        }
        return Results.error({
            errorMessage: LocalizationManager.lazy(
                'interpreter',
                'command_string_parser_missing_value',
                undefined
            ),
            hint: LocalizationManager.lazy(
                'interpreter',
                'command_string_parser_missing_value_hint',
                undefined
            ),
        })
    }
}
