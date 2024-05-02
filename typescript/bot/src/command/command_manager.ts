import { LocalizationManager } from '../localization/localization_manager.ts'
import { ErrorResult, Result, Results } from 'commons/lib/utils/result'
import type { Command } from './command.ts'
import { ArgumentDefinition, CommandDefinition } from './command_builder.ts'
import {
    ASTCommand,
    ASTExpression,
    ASTString,
    ASTUnit,
} from './language/ast.ts'
import { InterpreterError } from './language/interpreter.ts'
import { Option, Options } from 'commons/lib/utils/option.ts'
import { Cursor } from 'commons/lib/data-structures/cursor.ts'
import { unreachable } from 'commons/lib/utils/error.ts'
import { enumerated } from 'commons/lib/utils/array.ts'
import { MapLike } from 'typescript'

type CommandMap = Map<string, CommandDefinition<any>>

interface DuplicateCommandIdentifier {
    kind: 'duplicate_command_identifier'
    identifier: string
}

interface InvalidCommandDefinition {
    kind: 'invalid_command_definition'
    reason: string
}

export type CommandManagerError =
    | DuplicateCommandIdentifier
    | InvalidCommandDefinition

export class CommandManager {
    /*
     * The commands map houses all commands, keyed by a unique identifier that is checked at registration time.
     * If a command with the given key already exists, we log an error and ignore the registration attempt.
     */
    private commandMap: CommandMap = new Map()

    constructor(
        private deps: {},
        args: { commands: Command[] }
    ) {
        for (const command of args.commands) {
            const result = this.register(command)
            if (Results.isErr(result)) {
                // If a command is invalid at startup time, we want to panic and stop execution
                // That way we are immediately notified and can fix the issue
                unreachable(
                    result.error.kind === 'duplicate_command_identifier'
                        ? `Duplicate command identifier ${result.error.identifier}`
                        : result.error.kind
                )
            }
        }
    }

    register(command: Command): Result<void, CommandManagerError> {
        const definition = command.buildDefinition()
        if (Results.isErr(definition)) {
            return Results.error({
                kind: 'invalid_command_definition',
                reason: definition.error.kind,
            })
        }
        if (this.commandMap.has(definition.identifier)) {
            return Results.error({
                kind: 'duplicate_command_identifier',
                identifier: definition.identifier,
            })
        }
        this.commandMap.set(definition.identifier, definition)
        return Results.ok(undefined)
    }

    matchCommand(
        argumentList: ASTString[],
        aliasTree: AliasTree,
        commandMap: CommandMap
    ): Option<{ definition: CommandDefinition<any>; arguments: string[] }> {
        if (argumentList.length === 0) {
            return null
        }
        const cursor = new Cursor(argumentList)
        let node = aliasTree.children.get(cursor.next()!.value) ?? null
        if (!node) {
            return null
        }
        let next
        while ((next = cursor.next())) {
            if (!next) {
                break
            }
            if (!node.children.has(next.value)) {
                break
            }
            node = node.children.get(next.value)!
        }
        return Options.map(
            Options.fromTruthy(commandMap.get(node.commandIdentifier)),
            (definition) => ({
                definition: definition,
                arguments: argumentList
                    .slice(cursor.position - 1)
                    .map((node) => node.value),
            })
        )
    }

    /**
     * If we reached this funtion, argument.at(0) is '-'
     */
    private parseArgumentName(argument: string): string {
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
     * This can actually be moved into the language parser but I decided against it
     */
    parseArguments(
        argumentList: string[],
        argumentDefinition: CommandDefinition<
            ArgumentDefinition<any, any, unknown>[]
        >['arguments']
    ): Result<MapLike<unknown>, InterpreterError> {
        const args: MapLike<unknown> = {}
        const positionalArguments = []
        const cursor = new Cursor(argumentList)
        let argument
        while ((argument = cursor.next())) {
            // First we parse all named arguments, while deferring positional arguments for later
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
                            kind: 'localized_error',
                            lazyLocale: LocalizationManager.lazy(
                                'interpreter',
                                'invalidArgument',
                                [
                                    definition.name,
                                    parsed.error as string,
                                    argumentList.join(''),
                                    definition.parser.hint(),
                                ]
                            ),
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
                        kind: 'localized_error',
                        lazyLocale: LocalizationManager.lazy(
                            'interpreter.missingRequiredArgument',
                            [
                                definition.name,
                                argumentList.join(''),
                                definition.parser.hint(),
                            ]
                        ),
                    })
                }
                break
            }
            const result = definition.parser.parse(cursor)
            if (Results.isErr<string>(result)) {
                return Results.error({
                    kind: 'localized_error',
                    lazyLocale: LocalizationManager.lazy(
                        'interpreter.invalidArgument',
                        [
                            definition.name,
                            positionalArguments[index],
                            argumentList.join(''),
                            definition.parser.hint(),
                        ]
                    ),
                })
            }
            args[definition.name] = result
        }
        return args
    }

    execute(
        command: ASTCommand,
        aliasTrees: AliasTree[]
    ): Result<ASTExpression, InterpreterError> {
        for (const aliasTree of aliasTrees) {
            const parsed = this.matchCommand(
                command.arguments,
                aliasTree,
                this.commandMap
            )
            if (parsed) {
                const parsedArguments = this.parseArguments(
                    parsed.arguments,
                    parsed.definition.arguments
                )
                if (Results.isErr(parsedArguments)) {
                    return parsedArguments
                }
                parsed.definition.callback(parsedArguments, {})
                return Results.ok(ASTUnit)
            }
        }
        return Results.error({
            kind: 'localized_error',
            lazyLocale: LocalizationManager.lazy('interpreter.unknownCommand', [
                command.arguments[0].value,
            ]),
        })
    }
}
