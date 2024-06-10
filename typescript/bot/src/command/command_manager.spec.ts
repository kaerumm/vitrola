import { describe, test, expect } from 'bun:test'
import { CommandManager } from './command_manager'
import { Command } from './command'
import { Result, Results } from 'commons/lib/utils/result'
import {
    CommandDefinition,
    CommandBuildError,
    CommandBuilder,
} from './command_builder'
import { ASTCommand, ASTNode, ASTString, ASTUnit } from './language/ast'
import { unreachable } from 'commons/lib/utils/error'

class TestCommand1 implements Command {
    buildDefinition(): Result<CommandDefinition<any>, CommandBuildError> {
        return CommandBuilder.new('testcommand1').build(async () => ASTUnit)
    }
}

class TestCommand2 implements Command {
    buildDefinition(): Result<CommandDefinition<any>, CommandBuildError> {
        return CommandBuilder.new('testcommand1').build(async () => ASTUnit)
    }
}

describe('Command manager', function () {
    test('Duplicate command ids should throw an error', function () {
        expect(() => {
            new CommandManager({
                commands: [new TestCommand1(), new TestCommand2()],
            })
        }).toThrow('Duplicate command')
    })

    const commandManager = new CommandManager({
        commands: [new TestCommand1()],
    })

    test('resolveCommandName should resolve to null when there are no matches', function () {
        let match = commandManager['resolveCommandName'](
            [ASTNode(ASTString('none'))],
            { children: {} }
        )
        expect(match.resolved).toEqual(null)
        expect(match.unmatchedArgument!.expression.value).toEqual('none')
        match = commandManager['resolveCommandName'](
            [
                ASTNode(ASTString('kinda')),
                ASTNode(ASTString('nested')),
                ASTNode(ASTString('command')),
            ],
            {
                children: {
                    kinda: {
                        children: {
                            nested: {},
                        },
                    },
                },
            }
        )
        expect(match.resolved).toEqual(null)
        expect(match.unmatchedArgument!.expression.value).toEqual('command')
        expect(match.matchedArguments).toEqual([
            ASTNode(ASTString('kinda')),
            ASTNode(ASTString('nested')),
        ])
    })

    test('resolveCommandName should resolve to commands when the tree is flat', function () {
        let match = commandManager['resolveCommandName'](
            [ASTNode(ASTString('test')), ASTNode(ASTString('argument'))],
            {
                children: {
                    test: {
                        commandIdentifier: 'testcommand1',
                    },
                },
            }
        )
        expect(match.resolved?.aliasNode.commandIdentifier).toEqual(
            'testcommand1'
        )
        expect(match.resolved?.arguments).toEqual([
            ASTNode(ASTString('argument')),
        ])
        expect(match.unmatchedArgument).toEqual(null)
        expect(match.matchedArguments).toEqual([ASTNode(ASTString('test'))])
    })

    test('matchCommand matches at root', function () {
        const match = commandManager['matchCommand'](
            ASTNode(ASTCommand([ASTNode(ASTString('test'))])),
            []
        )
        if (Results.isOk(match)) {
            unreachable(void expect(true).toEqual(false))
        }
        expect(match.error.partialDSLError.errorMessage['key']).toEqual(
            'commander_no_alias_trees'
        )
    })

    test('matchCommand does not match a node that does not point to a command', function () {
        const match = commandManager['matchCommand'](
            ASTNode(ASTCommand([ASTNode(ASTString('test'))])),
            [
                {
                    children: { test: {} },
                },
            ]
        )
        if (Results.isOk(match)) {
            unreachable(void expect(true).toEqual(false))
        }
        expect(match.error.partialDSLError.errorMessage['key']).toEqual(
            'commander_command_not_found'
        )
    })

    test('matchCommand matches a command that is nested in a non-command node', function () {
        const match = commandManager['matchCommand'](
            ASTNode(
                ASTCommand([
                    ASTNode(ASTString('menu')),
                    ASTNode(ASTString('test')),
                ])
            ),
            [
                {
                    children: {
                        menu: {
                            children: {
                                test: {
                                    commandIdentifier: 'testcommand1',
                                },
                            },
                        },
                    },
                },
            ]
        )
        if (Results.isErr(match)) {
            unreachable(void expect(true).toEqual(false))
        }
        expect(match.definition.identifier).toEqual('testcommand1')
    })

    test('matchCommand respects the order of the alias trees given to it', function () {
        const match = commandManager['matchCommand'](
            ASTNode(ASTCommand([ASTNode(ASTString('test'))])),
            [
                {
                    children: {
                        nomatch: { commandIdentifier: 'testcommand2' },
                    },
                },
                { children: { test: { commandIdentifier: 'testcommand1' } } },
                { children: { test: { commandIdentifier: 'testcommand2' } } },
            ]
        )
        if (Results.isErr(match)) {
            unreachable(void expect(true).toEqual(false))
        }
        expect(match.definition.identifier).toEqual('testcommand1')
    })
})
