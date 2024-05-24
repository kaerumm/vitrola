import { ErrorResult, Result, Results } from 'commons/lib/utils/result'
import { ASTCommand, ASTExpression, ASTNode, ASTUnit } from './ast'
import { LocalizationManager } from '../../localization/localization_manager'
import { enumerated } from 'commons/lib/utils/array'
import { ArgumentDefinition, CommandDefinition } from '../command_builder'
import { MapLike } from 'typescript'
import { Cursor } from 'commons/lib/data-structures/cursor'
import { InterpreterEnvironment } from './interpreter'
import { DSLError, PartialDSLError } from '../commander'

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
        argumentList: string[],
        argumentDefinition: CommandDefinition<
            ArgumentDefinition<any, any, unknown>[]
        >['arguments']
    ): Result<MapLike<unknown>, PartialDSLError> {
        const args: MapLike<unknown> = {}
        const positionalArguments = []
        const cursor = new Cursor(argumentList)
        let argument
        while ((argument = cursor.next())) {
            // First we parse all named arguments, while deferring positional arguments for later, but we keep
            // the order
            switch (true) {
                case argument.charAt(0) === '-':
                    const name = this.parseArgumentName(argument)
                    const definition = argumentDefinition.named.get(name)
                    if (!definition) {
                        break
                    }
                    const parsed = definition.parser.parse(cursor)
                    if (Results.isErr(parsed)) {
                        return Results.error({
                            errorMessage: parsed.error,
                            hint: definition.parser.hint(),
                        })
                    }
                    args[name] = parsed
                    break
                default:
                    positionalArguments.push(argument)
                    break
            }
        }
        for (const [definition, index] of enumerated(
            argumentDefinition.positional
        )) {
            if (index >= positionalArguments.length) {
                if (!definition.optional) {
                    return Results.error({
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
                    })
                }
                break
            }
            const result = definition.parser.parse(cursor)
            if (Results.isErr(result)) {
                return Results.error({
                    errorMessage: result.error,
                    hint: definition.parser.hint(),
                })
            }
            args[definition.name] = result
        }
        return args
    }

    public static async interpret(
        commandNode: ASTNode<ASTCommand>,
        environment: InterpreterEnvironment
    ): Promise<Result<ASTExpression, PartialDSLError>> {
        // Get command manager from the scope, along with the alias trees
        const parsed = environment.commandContext.commandManager.matchCommand(
            commandNode.expression.arguments.map((node) => node.expression),
            environment.commandContext.aliasTrees
        )
        if (Results.isErr(parsed)) {
            return parsed
        }
        const parsedArguments = this.parseArguments(
            parsed.arguments,
            parsed.definition.arguments
        )
        if (Results.isErr(parsedArguments)) {
            return parsedArguments
        }
        return parsed.definition.callback(parsedArguments, {})
    }
}
