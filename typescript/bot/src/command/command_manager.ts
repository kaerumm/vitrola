import { ErrorResult, Result, Results } from 'commons/lib/utils/result'
import type { Command } from './command.ts'
import { CommandDefinition } from './command_builder.ts'
import { ASTString } from './language/ast.ts'
import { Option, Options } from 'commons/lib/utils/option.ts'
import { Cursor } from 'commons/lib/data-structures/cursor.ts'
import { unreachable } from 'commons/lib/utils/error.ts'
import {
    AliasNode,
    AliasTree,
    CommandAliasNode,
} from '../../locales/base/index.ts'
import { PartialDSLError } from './commander.ts'
import { LocalizationManager } from '../localization/localization_manager.ts'

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
    unmatchedArgument: ASTString
    matchedArguments: ASTString[]
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
        argumentList: ASTString[],
        aliasTrees: AliasTree[]
    ): Result<
        { definition: CommandDefinition<any>; arguments: string[] },
        PartialDSLError
    > {
        let error: Option<
            Pick<
                ReturnType<CommandManager['resolveCommandName']>,
                'unmatchedArgument' | 'matchedArguments'
            >
        > = null
        if (aliasTrees.length <= 0) {
            return Results.error({
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
            })
        }
        for (const aliasTree of aliasTrees) {
            const result = this.resolveCommandName(argumentList, aliasTree)
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
            errorMessage: LocalizationManager.lazy(
                'interpreter',
                'commander_command_not_found',
                [
                    error.matchedArguments
                        .map((n) => n.value)
                        .concat(error.unmatchedArgument.value),
                ]
            ),
            hint: LocalizationManager.lazy(
                'interpreter',
                'commander_command_not_found_hint',
                [error.unmatchedArgument.value]
            ),
        })
    }

    private resolveCommandName(
        argumentList: ASTString[],
        aliasTree: AliasTree
    ): {
        resolved: Option<{
            aliasNode: CommandAliasNode
            arguments: string[]
        }>
        unmatchedArgument: ASTString
        matchedArguments: ASTString[]
    } {
        if (argumentList.length === 0) {
            return {
                resolved: null,
                unmatchedArgument: ASTString(''),
                matchedArguments: [],
            }
        }
        const cursor = new Cursor(argumentList)
        const rootName = cursor.next()
        let aliasNode = aliasTree[rootName!.value] ?? null
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
            if (!aliasNode.children || !aliasNode.children[next.value]) {
                break
            }
            aliasNode = aliasNode.children[next.value]!
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
                    .map((node) => node.value),
            },
            matchedArguments,
            unmatchedArgument,
        }
    }
}

function aliasNodeIsCommandNode(node: AliasNode): node is CommandAliasNode {
    return !!node.commandIdentifier
}
