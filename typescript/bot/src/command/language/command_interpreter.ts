import { Result, Results } from 'commons/lib/utils/result'
import { ASTCommand, ASTExpression, ASTNode, ASTString } from './ast'
import { LocalizationManager } from '../../localization/localization_manager'
import { enumerated } from 'commons/lib/utils/array'
import { ArgumentDefinition, CommandDefinition } from '../command_builder'
import { MapLike } from 'typescript'
import { Cursor } from 'commons/lib/data-structures/cursor'
import { InterpreterEnvironment, InterpreterError } from './interpreter'
import { assert } from 'commons/lib/utils/error'
import { production } from 'commons/lib/bundletime/production' with { type: 'macro' }

export class CommandInterpreter {
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
        if (!production()) {
            // bundletime, but this check should be moved into whatever location compiles the commands
            assert(
                argumentDefinition.positional.every((value, index, defs) => {
                    if (index === 0) {
                        return true
                    }
                    if (!value.optional && defs[index - 1].optional) {
                        return false
                    }
                    return true
                }),
                'Positional arguments must be ordered from optional to required'
            )
        }
        const args: MapLike<unknown> = {}
        const positionalArguments = []
        const cursor = new Cursor(argumentList)
        let argument
        while ((argument = cursor.next())) {
            // First we parse all named arguments, while deferring positional arguments for later, but we keep
            // the order
            switch (true) {
                case argument.expression.value.charAt(0) === '-':
                    const name = argument.expression.value.slice(1)
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
        // Check if there are any required named arguments missing
        for (const definition of argumentDefinition.named.values()) {
            if (!definition.optional && !args[definition.name]) {
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
        }
        // Go through positional arguments and parse
        const positionalArgumentsCursor = new Cursor(positionalArguments)
        for (const [definition, index] of enumerated(
            argumentDefinition.positional
        )) {
            // Positional arguments are ordered, so if we don't have enough arguments and
            // the argument definition we are looking at is optional, that means that every argument definition after it is also optional.
            if (index >= positionalArguments.length) {
                if (definition.optional) {
                    break
                }
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
