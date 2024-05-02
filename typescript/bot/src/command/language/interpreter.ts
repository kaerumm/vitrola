import { type LazyLocale } from '../../localization/localization_manager'
import { Result, Results } from 'commons/lib/utils/result'
import { CommandManager } from '../command_manager'
import {
    ASTBinary,
    ASTBlock,
    ASTCommand,
    ASTExpression,
    ASTGroup,
    ASTUnit,
} from './ast'

interface LocalizedError {
    kind: 'localized_error'
    lazyLocale: LazyLocale<any>
}

export type InterpreterError = LocalizedError

// Extremely simple interpreter, no scopes, no frames, no variables, we only provide a way to execute expressions
export class Interpreter {
    constructor(private deps: { commandManager: CommandManager }) {}

    interpret(
        expression: ASTExpression
    ): Result<ASTExpression, InterpreterError> {
        switch (expression.kind) {
            // Logical expressions, they do something and return a result
            case 'block':
                return this.block(expression)
            case 'group':
                return this.group(expression)
            case 'binary':
                return this.binary(expression)
            case 'command':
                return this.command(expression)
            // Data expressions, they simply return themselves
            case 'string':
                return expression
            case 'unit':
                return ASTUnit
        }
    }

    // Currently blocks only appear once, at the root, as a list of expressions to execute
    // There is no return/break support so we simply execute the expressions for whatever
    // side effects they might have and return a Unit data value
    private block(block: ASTBlock): Result<ASTExpression, InterpreterError> {
        for (const expression of block.expressions) {
            const result = this.interpret(expression)
            if (Results.isErr(result)) {
                return result
            }
        }
        return ASTUnit
    }

    private group(group: ASTGroup): Result<ASTExpression, InterpreterError> {
        return this.interpret(group.expression)
    }

    private command(
        command: ASTCommand
    ): Result<ASTExpression, InterpreterError> {
        return this.deps.commandManager.execute(command)
    }

    private logicalAnd(
        lhs: ASTExpression,
        rhs: ASTExpression
    ): Result<ASTExpression, InterpreterError> {
        const lhsResult = this.interpret(lhs)
        // Short circuits if lhs errored
        if (Results.isErr(lhsResult)) {
            return lhsResult
        }
        return this.interpret(rhs)
    }

    private logicalOr(
        lhs: ASTExpression,
        rhs: ASTExpression
    ): Result<ASTExpression, InterpreterError> {
        const lhsResult = this.interpret(lhs)
        // Short circuits if lhs completed successfully
        if (Results.isOk(lhsResult)) {
            return lhsResult
        }
        return this.interpret(rhs)
    }

    private binary(binary: ASTBinary): Result<ASTExpression, InterpreterError> {
        switch (binary.operator.kind) {
            case 'and':
                return this.logicalAnd(binary.lhs, binary.rhs)
            case 'or':
                return this.logicalOr(binary.lhs, binary.rhs)
        }
    }
}
