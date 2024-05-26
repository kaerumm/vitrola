import { Result, Results } from 'commons/lib/utils/result'
import type { Command } from './command.ts'
import { CommandDefinition } from './command_builder.ts'
import { ASTCommand, ASTNode, ASTString } from './language/ast.ts'
import { Option } from 'commons/lib/utils/option.ts'
import { Cursor } from 'commons/lib/data-structures/cursor.ts'
import { unreachable } from 'commons/lib/utils/error.ts'
import {
    AliasNode,
    AliasTree,
    CommandAliasNode,
} from '../../locales/base/index.ts'
import { LocalizationManager } from '../localization/localization_manager.ts'
import { InterpreterError } from './language/interpreter.ts'

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

export interface CommandNotFound {
    unmatchedArgument: ASTNode<ASTString>
    matchedArguments: ASTNode<ASTString>[]
}

export class CommandManager {
    /*
     * The commands map houses all commands, keyed by a unique identifier that is checked at registration time.
     * If a command with the given key already exists, we log an error and ignore the registration attempt.
     */
    private commandMap: CommandMap = new Map()

    constructor(args: { commands: Command[] }) {
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
        node: ASTNode<ASTCommand>,
        aliasTrees: AliasTree[]
    ): Result<
        { definition: CommandDefinition<any>; arguments: ASTNode<ASTString>[] },
        InterpreterError
    > {
        let error: Option<
            Pick<
                ReturnType<CommandManager['resolveCommandName']>,
                'unmatchedArgument' | 'matchedArguments'
            >
        > = null
        if (aliasTrees.length <= 0) {
            return Results.error({
                partialDSLError: {
                    errorMessage: LocalizationManager.lazy(
                        'interpreter',
                        'commander_no_alias_trees',
                        undefined
                    ),
                    hint: LocalizationManager.lazy(
                        'interpreter',
                        'commander_no_alias_trees_hint',
                        undefined
                    ),
                },
                node: node,
            })
        }
        for (const aliasTree of aliasTrees) {
            const result = this.resolveCommandName(
                node.expression.arguments,
                aliasTree
            )
            if (result.resolved === null) {
                if (
                    result.matchedArguments.length >
                    (error?.matchedArguments.length ?? -1)
                ) {
                    error = {
                        matchedArguments: result.matchedArguments,
                        unmatchedArgument: result.unmatchedArgument,
                    }
                }
                continue
            }
            const definition = this.commandMap.get(
                result.resolved.aliasNode.commandIdentifier
            )
            if (!definition) {
                error = {
                    matchedArguments: result.matchedArguments,
                    unmatchedArgument: result.unmatchedArgument,
                }
                continue
            }
            return {
                definition: definition,
                arguments: result.resolved.arguments,
            }
        }
        if (!error) {
            unreachable(
                'There is atleast one aliasTree, and command resolution either returns a command definition or sets error'
            )
        }
        return Results.error({
            partialDSLError: {
                errorMessage: LocalizationManager.lazy(
                    'interpreter',
                    'commander_command_not_found',
                    [
                        error.matchedArguments
                            .map((n) => n.expression.value)
                            .concat(error.unmatchedArgument.expression.value),
                    ]
                ),
                hint: LocalizationManager.lazy(
                    'interpreter',
                    'commander_command_not_found_hint',
                    [error.unmatchedArgument.expression.value]
                ),
            },
            node: error.unmatchedArgument,
        })
    }

    private resolveCommandName(
        argumentList: ASTNode<ASTString>[],
        aliasTree: AliasTree
    ): {
        resolved: Option<{
            aliasNode: CommandAliasNode
            arguments: ASTNode<ASTString>[]
        }>
    } & CommandNotFound {
        if (argumentList.length === 0) {
            unreachable(
                'Argument list must never be empty since we must have parsed a command to get here'
            )
        }
        const cursor = new Cursor(argumentList)
        const rootName = cursor.next()
        let aliasNode = aliasTree[rootName!.expression.value] ?? null
        if (!aliasNode) {
            return {
                resolved: null,
                unmatchedArgument: rootName!,
                matchedArguments: [],
            }
        }
        const matchedArguments = [rootName!]
        let unmatchedArgument = rootName!
        let next
        while ((next = cursor.next())) {
            if (!next) {
                break
            }
            if (
                !aliasNode.children ||
                !aliasNode.children[next.expression.value]
            ) {
                break
            }
            aliasNode = aliasNode.children[next.expression.value]!
            matchedArguments.push(next)
            unmatchedArgument = next!
        }
        if (!aliasNodeIsCommandNode(aliasNode)) {
            return { resolved: null, matchedArguments, unmatchedArgument }
        }
        return {
            resolved: {
                aliasNode,
                arguments: argumentList
                    .slice(cursor.position - 1)
                    .map((node) => node),
            },
            matchedArguments,
            unmatchedArgument,
        }
    }
}

function aliasNodeIsCommandNode(node: AliasNode): node is CommandAliasNode {
    return !!node.commandIdentifier
}
