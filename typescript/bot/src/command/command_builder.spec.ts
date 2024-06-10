import { describe, test, expect } from 'bun:test'
import { ArgumentDefinition, CommandBuilder } from './command_builder'
import { FlagParser, SingletonFlagParser } from './parsers/flag'
import { Results } from 'commons/lib/utils/result'

describe('Command builder', function () {
    test('organizeArguments', function () {
        const args: ArgumentDefinition<any, any, any>[] = [
            {
                name: 'one',
                description: 'one',
                parser: SingletonFlagParser,
                optional: true,
                positional: true,
            },
            {
                name: 'two',
                description: 'two',
                parser: SingletonFlagParser,
                optional: false,
                positional: true,
            },

            {
                name: 'three',
                description: 'three',
                parser: SingletonFlagParser,
                optional: false,
                positional: true,
            },
            {
                name: 'four',
                description: 'four',
                parser: SingletonFlagParser,
                optional: false,
                positional: false,
            },
        ]
        const builder = CommandBuilder.new('test')
        const resulting = builder['organizeArguments'](args)
        if (Results.isErr(resulting)) {
            expect(false).toEqual(true)
            return
        }
        expect(resulting.named.has('four'))
        expect(resulting.positional[0].name).toEqual('two')
        expect(resulting.positional[1].name).toEqual('three')
        expect(resulting.positional[2].name).toEqual('one')
        const args_duplicated: ArgumentDefinition<any, any, any>[] = [
            {
                name: 'duplicate',
                description: 'duplicate',
                parser: SingletonFlagParser,
                optional: false,
                positional: false,
            },
            {
                name: 'duplicate',
                description: 'duplicate',
                parser: SingletonFlagParser,
                optional: false,
                positional: false,
            },
        ]
        const result = builder['organizeArguments'](args_duplicated)
        expect(Results.isErr(result)).toEqual(true)
    })
})
