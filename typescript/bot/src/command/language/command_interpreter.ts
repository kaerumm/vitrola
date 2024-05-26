import { Result, Results } from 'commons/lib/utils/result'
import { ASTCommand, ASTExpression, ASTNode, ASTString } from './ast'
import { LocalizationManager } from '../../localization/localization_manager'
import { enumerated } from 'commons/lib/utils/array'
import { ArgumentDefinition, CommandDefinition } from '../command_builder'
import { MapLike } from 'typescript'
import { Cursor } from 'commons/lib/data-structures/cursor'
import { InterpreterEnvironment, InterpreterError } from './interpreter'

export class CommandInterpreter {
    /**
     * If we reached this funtion, argument.at(0) is '-'
     */
    private static parseArgumentName(argument: string): string {
        let from = 1
        if (argument.charAt(1) === '-') {
            from += 1
        }
        return argument.slice(from)
    }

    /**
     * This is a very tiny parser, all it looks for is if there is a '-' or '--' at the start
     * of the argument, if there is one then we parse according to the argument's parser
     * *
     */
    private static parseArguments(
        argumentList: ASTNode<ASTString>[],
        argumentDefinition: CommandDefinition<
            ArgumentDefinition<any, any, unknown>[]
        >['arguments']
    ): Result<MapLike<unknown>, InterpreterError> {
        const args: MapLike<unknown> = {}
        if (argumentList.length === 0) {
            return args
        }
        const positionalArguments = []
        const cursor = new Cursor(argumentList)
        let argument
        while ((argument = cursor.next())) {
            // First we parse all named arguments, while deferring positional arguments for later, but we keep
            // the order
            switch (true) {
                case argument.expression.value.charAt(0) === '-':
                    const name = this.parseArgumentName(
                        argument.expression.value
                    )
                    const definition = argumentDefinition.named.get(name)
                    if (!definition) {
                        break
                    }
                    const parsed = definition.parser.parse(cursor)
                    if (Results.isErr(parsed)) {
                        return Results.error({
                            partialDSLError: parsed.error,
                            node: argument,
                        })
                    }
                    args[name] = parsed[0]
                    break
                default:
                    positionalArguments.push(argument)
                    break
            }
        }
        const positionalArgumentsCursor = new Cursor(positionalArguments)
        for (const [definition, index] of enumerated(
            argumentDefinition.positional
        )) {
            if (index >= positionalArguments.length) {
                if (!definition.optional) {
                    return Results.error({
                        partialDSLError: {
                            errorMessage: LocalizationManager.lazy(
                                'interpreter',
                                'commander_required_argument',
                                [definition.name, definition.description]
                            ),
                            hint: LocalizationManager.lazy(
                                'interpreter',
                                'commander_required_argument_hint',
                                undefined
                            ),
                        },
                        node: argumentList.at(-1)!,
                    })
                }
                break
            }
            const result = definition.parser.parse(positionalArgumentsCursor)
            if (Results.isErr(result)) {
                return Results.error({
                    partialDSLError: result.error,
                    node: argumentList[cursor.position - 1],
                })
            }
            args[definition.name] = result[0]
        }
        return args
    }

    public static async interpret(
        commandNode: ASTNode<ASTCommand>,
        environment: InterpreterEnvironment
    ): Promise<Result<ASTExpression, InterpreterError>> {
        // Get command manager from the scope, along with the alias trees
        const matched = environment.commandContext.commandManager.matchCommand(
            commandNode,
            environment.commandContext.aliasTrees
        )
        if (Results.isErr(matched)) {
            return matched
        }
        const parsedArguments = this.parseArguments(
            matched.arguments,
            matched.definition.arguments
        )
        if (Results.isErr(parsedArguments)) {
            return parsedArguments
        }
        return Results.mapError(
            await matched.definition.callback(parsedArguments, {}),
            (partialDSLError) => ({
                partialDSLError,
                node: commandNode,
            })
        )
    }
}
