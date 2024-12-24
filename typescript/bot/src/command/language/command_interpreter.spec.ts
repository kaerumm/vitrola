import { describe, test, expect } from 'bun:test'
import { CommandInterpreter } from './command_interpreter'
import { SingletonFlagParser } from '../parsers/flag'
import { Results } from 'commons/lib/utils/result'
import { unreachable } from 'commons/lib/utils/error'
import { ASTCommand, ASTNode, ASTString } from './ast'
import { StringParser } from '../parsers/string'
import { LazyLocale } from '../../localization/localization_manager'

describe('parseArguments', function () {
    const node: ASTNode<ASTCommand> = {
        expression: { kind: 'command', arguments: [] },
        tokenRange: [0, 0],
    }

    test('parseArguments should return an error if required named arguments were not provided', function () {
        const named = new Map()
        named.set('test', {
            name: 'test',
            description: 'test',
            parser: SingletonFlagParser,
            optional: false,
        })
        const result = CommandInterpreter['parseArguments'](node, [], {
            named,
            positional: [],
        })
        if (Results.isOk(result)) {
            return expect(true).toEqual(false)
        }
        if (
            result.error.partialDSLError.errorMessage instanceof LazyLocale ===
            false
        ) {
            return expect(true).toEqual(false)
        }
        expect(result.error.partialDSLError.errorMessage['key']).toEqual(
            'commander_required_argument'
        )
    })

    test('parseArguments should return an error if required positional arguments were not provided', function () {
        const named = new Map()
        const result = CommandInterpreter['parseArguments'](node, [], {
            named,
            positional: [
                {
                    name: 'test',
                    optional: false,
                    positional: true,
                    description: 'test',
                    parser: SingletonFlagParser,
                },
            ],
        })
        if (Results.isOk(result)) {
            unreachable(void expect(true).toEqual(false))
        }
        if (
            result.error.partialDSLError.errorMessage instanceof LazyLocale ===
            false
        ) {
            return expect(true).toEqual(false)
        }
        expect(result.error.partialDSLError.errorMessage['key']).toEqual(
            'commander_required_argument'
        )
    })

    test('parseArguments should correctly parse named arguments', function () {
        let named = new Map()
        named.set('test', {
            name: 'test',
            description: 'test',
            parser: SingletonFlagParser,
        })
        let result = CommandInterpreter['parseArguments'](
            node,
            [ASTNode(ASTString('-test'))],
            {
                named,
                positional: [],
            }
        )
        if (Results.isErr(result)) {
            unreachable(void expect(true).toEqual(false))
        }
        expect(result['test']).toEqual(true)
    })

    test('parseArguments should parse positional arguments in the correct order', function () {
        let named = new Map()
        let result = CommandInterpreter['parseArguments'](
            node,
            [
                ASTNode(ASTString('test')),
                ASTNode(ASTString('test2')),
                ASTNode(ASTString('test3')),
            ],
            {
                named,
                positional: [
                    {
                        name: 'test',
                        description: 'test',
                        parser: new StringParser(),
                        optional: false,
                    },
                    {
                        name: 'test3',
                        description: 'test',
                        parser: new StringParser(),
                        optional: false,
                    },
                    {
                        name: 'test2',
                        description: 'test',
                        parser: new StringParser(),
                        optional: true,
                    },
                ],
            }
        )
        if (Results.isErr(result)) {
            unreachable(void expect(true).toEqual(true))
        }
        expect(result['test']).toEqual('test')
        expect(result['test2']).toEqual('test3')
        expect(result['test3']).toEqual('test2')
    })

    test('parseArguments optional arguments should be optional', function () {
        let named = new Map()
        named.set('named', {
            name: 'named',
            description: 'named',
            parser: new StringParser(),
            optional: true,
        })
        const positional = [
            {
                name: 'test',
                description: 'test',
                parser: new StringParser(),
                optional: true,
            },
        ]
        let result = CommandInterpreter['parseArguments'](node, [], {
            named,
            positional,
        })
        if (Results.isErr(result)) {
            unreachable(void expect(true).toEqual(true))
        }
        expect(result['test']).toEqual(undefined)
        expect(result['named']).toEqual(undefined)
        result = CommandInterpreter['parseArguments'](
            node,
            [ASTNode(ASTString('-named')), ASTNode(ASTString('value'))],
            {
                named,
                positional,
            }
        )
        if (Results.isErr(result)) {
            unreachable(void expect(true).toEqual(true))
        }
        expect(result['test']).toEqual(undefined)
        expect(result['named']).toEqual('value')
        result = CommandInterpreter['parseArguments'](
            node,
            [ASTNode(ASTString('value'))],
            {
                named,
                positional,
            }
        )
        if (Results.isErr(result)) {
            unreachable(void expect(true).toEqual(true))
        }
        expect(result['test']).toEqual('value')
        expect(result['named']).toEqual(undefined)
    })
})
