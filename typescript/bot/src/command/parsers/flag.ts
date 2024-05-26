import { Cursor } from 'commons/lib/data-structures/cursor.ts'
import type { Result } from 'commons/lib/utils/result.ts'
import type { ArgumentParser } from '../command_builder.ts'
import { ASTNode, ASTString } from '../language/ast.ts'
import { PartialDSLError } from '../commander.ts'

export class FlagParser implements ArgumentParser<boolean> {
    parse(
        _cursor: Cursor<ASTNode<ASTString>>
    ): Result<[boolean], PartialDSLError> {
        return [true]
    }
}

export const SingletonFlagParser = new FlagParser()
