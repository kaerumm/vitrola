import { test, describe, expect, mock } from 'bun:test'
import { Interpreter, InterpreterEnvironment } from './interpreter'
import { Parser } from './parser'
import { Tokenizer } from './tokenizer'
import { CommandManager } from '../command_manager'
import { Command } from '../command'
import { Result, Results } from 'commons/lib/utils/result'
import {
    CommandDefinition,
    CommandBuildError,
    CommandBuilder,
} from '../command_builder'
import { LocalizationManager } from '../../localization/localization_manager'
import { ASTBinary, ASTGroup, ASTNode, ASTString } from './ast'
import { NumberParser } from '../parsers/number'

function errorCommand() {
    const m = mock(async (args) => {
        return Results.error({
            errorMessage: LocalizationManager.lazy(
                'interpreter',
                'testing_unreachable',
                undefined
            ),
            hint: LocalizationManager.lazy(
                'interpreter',
                'testing_unreachable',
                undefined
            ),
        })
    })
    return [
        m,
        new (class implements Command {
            buildDefinition(): Result<
                CommandDefinition<any>,
                CommandBuildError
            > {
                return CommandBuilder.new('error')
                    .positional({
                        name: 'number',
                        description: 'number',
                        parser: new NumberParser(),
                    })
                    .build(m)
            }
        })(),
    ] as const
}
function callMockCommand() {
    const m = mock(async (args) => ASTString(args.number.toString()))
    return [
        m,
        new (class implements Command {
            buildDefinition(): Result<
                CommandDefinition<any>,
                CommandBuildError
            > {
                return CommandBuilder.new('callSpy')
                    .positional({
                        name: 'number',
                        description: 'just a number',
                        parser: new NumberParser(),
                    })
                    .build(m)
            }
        })(),
    ] as const
}

function testingEnvironment() {
    const [mock, cmd] = callMockCommand()
    const [errorMock, errorCmd] = errorCommand()
    return [
        mock,
        {
            builtin: {},
            commandContext: {
                commandManager: new CommandManager({
                    commands: [cmd, errorCmd],
                }),
                aliasTrees: [
                    {
                        error: { commandIdentifier: 'error' },
                        callSpy: { commandIdentifier: 'callSpy' },
                    },
                ],
            },
        },
        errorMock,
    ] satisfies [typeof mock, InterpreterEnvironment<{}>, typeof errorMock]
}

describe('Interpreter', function () {
    test('Unit expressions', async function () {
        const [mock, environment] = testingEnvironment()
        let result = await Interpreter['interpret'](
            Parser.parseOrUnreachable(
                Tokenizer.tokenizeOrUnreachable('()').spans
            ).expression.nodes[0] as ASTNode<ASTString>,
            environment
        )
        expect(Results.isOk(result)).toEqual(true)
        if (Results.isOk(result)) {
            expect(result.kind === 'unit').toEqual(true)
        }
    })

    describe('Binary expressions', function () {
        test('Logical and', async function () {
            const [mock, environment] = testingEnvironment()
            // Should return the rhs's value when none of the sides fail
            let result = await Interpreter['binary'](
                Parser.parseOrUnreachable(
                    Tokenizer.tokenizeOrUnreachable('callSpy 1 && callSpy 2')
                        .spans
                ).expression.nodes[0] as ASTNode<ASTBinary>,
                environment
            )
            expect(mock).toHaveBeenCalledTimes(2)
            expect(Results.isOk(result)).toEqual(true)
            if (Results.isOk(result)) {
                expect(
                    result.kind === 'string' && result.value === '2'
                ).toEqual(true)
            }
            // Should return lhs's error and short circuit if lhs fails
            mock.mockClear()
            result = await Interpreter['binary'](
                Parser.parseOrUnreachable(
                    Tokenizer.tokenizeOrUnreachable('error && callSpy 2').spans
                ).expression.nodes[0] as ASTNode<ASTBinary>,
                environment
            )
            expect(mock).toHaveBeenCalledTimes(0)
            expect(Results.isOk(result)).toEqual(false)
            // Should return rhs's error if rhs fails
            mock.mockClear()
            result = await Interpreter['binary'](
                Parser.parseOrUnreachable(
                    Tokenizer.tokenizeOrUnreachable('callSpy 1 && error').spans
                ).expression.nodes[0] as ASTNode<ASTBinary>,
                environment
            )
            expect(mock).toHaveBeenCalledTimes(1)
            expect(Results.isOk(result)).toEqual(false)
        })

        test('Logical or', async function () {
            const [mock, environment, errorMock] = testingEnvironment()
            // Should short circuit and return lhs if lhs does not fail
            let result = await Interpreter['binary'](
                Parser.parseOrUnreachable(
                    Tokenizer.tokenizeOrUnreachable('callSpy 1 || callSpy 2')
                        .spans
                ).expression.nodes[0] as ASTNode<ASTBinary>,
                environment
            )
            expect(mock).toHaveBeenCalledTimes(1)
            expect(Results.isOk(result)).toEqual(true)
            if (Results.isOk(result)) {
                expect(
                    result.kind === 'string' && result.value === '1'
                ).toEqual(true)
            }
            // Should return rhs's value if lhs fails but rhs does not
            mock.mockClear()
            errorMock.mockClear()
            result = await Interpreter['binary'](
                Parser.parseOrUnreachable(
                    Tokenizer.tokenizeOrUnreachable('error 1 || callSpy 2')
                        .spans
                ).expression.nodes[0] as ASTNode<ASTBinary>,
                environment
            )
            expect(mock).toHaveBeenCalledTimes(1)
            expect(errorMock).toHaveBeenCalledTimes(1)
            expect(Results.isOk(result)).toEqual(true)
            // Should return rhs's error if both side fails
            mock.mockClear()
            errorMock.mockClear()
            result = await Interpreter['binary'](
                Parser.parseOrUnreachable(
                    Tokenizer.tokenizeOrUnreachable('error 1 || error 2').spans
                ).expression.nodes[0] as ASTNode<ASTBinary>,
                environment
            )
            expect(errorMock).toHaveBeenCalledTimes(2)
            expect(mock).toHaveBeenCalledTimes(0)
            expect(Results.isOk(result)).toEqual(false)
            expect(errorMock).toHaveBeenNthCalledWith(1, { number: 1 }, {})
            expect(errorMock).toHaveBeenNthCalledWith(2, { number: 2 }, {})
        })
    })

    test('Block expressions', async function () {
        // Expressions should be run sequentially
        const [mock, environment] = testingEnvironment()
        let result = await Interpreter['block'](
            Parser.parseOrUnreachable(
                Tokenizer.tokenizeOrUnreachable('callSpy 1;callSpy 2;callSpy 3')
                    .spans
            ),
            environment
        )
        expect(Results.isOk(result)).toEqual(true)
        expect(mock).toHaveBeenCalledTimes(3)
        expect(mock).toHaveBeenNthCalledWith(
            1,
            {
                number: 1,
            },
            {}
        )
        expect(mock).toHaveBeenNthCalledWith(
            2,
            {
                number: 2,
            },
            {}
        )
        expect(mock).toHaveBeenNthCalledWith(
            3,
            {
                number: 3,
            },
            {}
        )
        mock.mockClear()
        // An error should exit early
        result = await Interpreter['block'](
            Parser.parseOrUnreachable(
                Tokenizer.tokenizeOrUnreachable('callSpy 1;error;callSpy 3')
                    .spans
            ),
            environment
        )
        expect(Results.isOk(result)).toEqual(false)
        expect(mock).toHaveBeenCalledTimes(1)
        expect(mock).toHaveBeenNthCalledWith(
            1,
            {
                number: 1,
            },
            {}
        )
    })

    test('Group expressions', async function () {
        // Group expressions should run grouped expressions and return their result
        const [mock, environment] = testingEnvironment()
        mock.mockResolvedValue(ASTString('result'))
        let result = await Interpreter['group'](
            Parser.parseOrUnreachable(
                Tokenizer.tokenizeOrUnreachable('(callSpy 1 && callSpy 2)')
                    .spans
            ).expression.nodes[0] as ASTNode<ASTGroup>,
            environment
        )
        expect(Results.isOk(result)).toEqual(true)
        if (Results.isOk(result)) {
            expect(
                result.kind === 'string' && result.value === 'result'
            ).toEqual(true)
        }
        expect(mock).toHaveBeenNthCalledWith(1, { number: 1 }, {})
        expect(mock).toHaveBeenNthCalledWith(2, { number: 2 }, {})
    })
})
