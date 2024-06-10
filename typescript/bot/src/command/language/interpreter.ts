import { Result, Results } from 'commons/lib/utils/result'
import {
    ASTBinary,
    ASTBlock,
    ASTCommand,
    ASTExpression,
    ASTGroup,
    ASTNode,
    ASTUnit,
} from './ast'
import { AliasTree } from '../../../locales/base'
import { CommandInterpreter } from './command_interpreter'
import { DSLError, PartialDSLError } from '../commander'
import { CommandManager } from '../command_manager'
import { MapLike } from 'typescript'

export interface InterpreterEnvironment {
    commandContext: {
        commandManager: CommandManager
        aliasTrees: AliasTree[]
    }
}

export interface InterpreterError {
    partialDSLError: PartialDSLError
    node: ASTNode<ASTExpression>
}

// Extremely simple interpreter, no scopes, no frames, no variables, we only provide a way to execute expressions
export class Interpreter {
    static async interpret(
        node: ASTNode<ASTExpression>,
        environment: InterpreterEnvironment
    ): Promise<Result<ASTExpression, InterpreterError>> {
        switch (node.expression.kind) {
            // Logical expressions, they do something and return a result
            case 'block':
                return this.block(node as ASTNode<ASTBlock>, environment)
            case 'group':
                return this.group(node as ASTNode<ASTGroup>, environment)
            case 'binary':
                return this.binary(node as ASTNode<ASTBinary>, environment)
            case 'command':
                return this.command(node as ASTNode<ASTCommand>, environment)
            // Data expressions, they simply return themselves
            case 'string':
                return node.expression
            case 'unit':
                return ASTUnit
        }
    }
    // Currently blocks only appear once, at the root, as a list of expressions to execute
    // There is no return/break support so we simply execute the expressions for whatever
    // side effects they might have and return a Unit data value
    private static async block(
        node: ASTNode<ASTBlock>,
        environment: InterpreterEnvironment
    ): Promise<Result<ASTExpression, InterpreterError>> {
        for (const n of node.expression.nodes) {
            const result = await this.interpret(n, environment)
            if (Results.isErr(result)) {
                return result
            }
        }
        return ASTUnit
    }

    private static async group(
        node: ASTNode<ASTGroup>,
        environment: InterpreterEnvironment
    ): Promise<Result<ASTExpression, InterpreterError>> {
        return this.interpret(node.expression.node, environment)
    }

    private static async command(
        command: ASTNode<ASTCommand>,
        environment: InterpreterEnvironment
    ): Promise<Result<ASTExpression, InterpreterError>> {
        return await CommandInterpreter.interpret(command, environment)
    }

    private static async logicalAnd(
        lhs: ASTNode<ASTExpression>,
        rhs: ASTNode<ASTExpression>,
        environment: InterpreterEnvironment
    ): Promise<Result<ASTExpression, InterpreterError>> {
        const lhsResult = await this.interpret(lhs, environment)
        // Short circuits if lhs errored
        if (Results.isErr(lhsResult)) {
            return lhsResult
        }
        return this.interpret(rhs, environment)
    }

    private static async logicalOr(
        lhs: ASTNode<ASTExpression>,
        rhs: ASTNode<ASTExpression>,
        environment: InterpreterEnvironment
    ): Promise<Result<ASTExpression, InterpreterError>> {
        const lhsResult = await this.interpret(lhs, environment)
        // Short circuits if lhs completed successfully
        if (Results.isOk(lhsResult)) {
            return lhsResult
        }
        return this.interpret(rhs, environment)
    }

    private static async binary(
        node: ASTNode<ASTBinary>,
        environment: InterpreterEnvironment
    ): Promise<Result<ASTExpression, InterpreterError>> {
        switch (node.expression.operator.kind) {
            case 'and':
                return this.logicalAnd(
                    node.expression.lhs,
                    node.expression.rhs,
                    environment
                )
            case 'or':
                return this.logicalOr(
                    node.expression.lhs,
                    node.expression.rhs,
                    environment
                )
        }
    }
}
