import { Cursor } from 'commons/lib/data-structures/cursor.ts'
import { LazyLocale } from '../localization/localization_manager.ts'
import { Results, type Result } from 'commons/lib/utils/result.ts'
import { ASTExpression, ASTNode, ASTString } from './language/ast.ts'
import { SingletonFlagParser } from './parsers/flag.ts'
import { PartialDSLError } from './commander.ts'

export interface CommandDefinition<
    Args extends ArgumentDefinition<string, boolean, unknown>[],
> {
    identifier: string
    arguments: {
        named: Map<string, ArgumentDefinition<string, boolean, unknown>>
        positional: ArgumentDefinition<string, boolean, unknown>[]
    }
    callback: CommandFunction<Args>
}

export interface ArgumentDefinition<
    N extends string,
    Opt extends boolean,
    Type,
> {
    name: N
    description: LazyLocale
    parser: ArgumentParser<Type>
    optional: Opt
    positional?: boolean
}

/**
 * Parsers may fail to parse, if what they receive is not what they expect.
 */
export interface ArgumentParser<Type> {
    // We use a tuple because a type of unknown messes with Results, and we need to use unknown in some places
    parse(cursor: Cursor<ASTNode<ASTString>>): Result<[Type], PartialDSLError>
}

interface DuplicateFlagName {
    kind: 'duplicate_flag_name'
    name: string
}

export type CommandBuildError = DuplicateFlagName

type TransformArgumentDefinitionIntoArgumentDictionary<
    Arguments extends ArgumentDefinition<any, any, any>[],
> = {
    [Value in Arguments[number] as Value['name']]:
        | (Value['optional'] extends true ? undefined : never)
        | ReturnType<Value['parser']['parse']> extends Result<infer Type, any>
        ? Type
        : never
}

export type CommandFunction<Args extends ArgumentDefinition<any, any, any>[]> =
    (
        args: TransformArgumentDefinitionIntoArgumentDictionary<Args>,
        deps: {}
    ) => Promise<Result<ASTExpression, PartialDSLError>>

/**
 * A command builder that guarantees type safety for the command callback by properly typing all of the arguments
 */
export class CommandBuilder<Args extends ArgumentDefinition<any, any, any>[]> {
    private arguments: ArgumentDefinition<any, any, any>[] = []

    // We use a private constructor to avoid creating a command builder with an invalid initial type parameter
    private constructor(private identifier: string) {}

    static new(identifier: string) {
        return new CommandBuilder<[]>(identifier)
    }

    /**
     * Arguments are optional by default
     */
    private argument<N extends string, ParsedType, Opt extends boolean = true>(
        argumentDefinition: Omit<
            ArgumentDefinition<N, Opt, ParsedType>,
            'optional'
        > & {
            optional?: Opt
        }
    ): CommandBuilder<[...Args, ArgumentDefinition<N, Opt, ParsedType>]> {
        const optional = argumentDefinition.optional ?? true
        this.arguments.push({
            ...argumentDefinition,
            optional,
        })
        // Can't mutate current instance's generic argument, would have to create a new one passing the new arguments
        // but that is wasteful
        return this as unknown as CommandBuilder<
            [...Args, ArgumentDefinition<N, Opt, ParsedType>]
        >
    }

    named<N extends string, ParsedType>(
        argumentDefinition: Omit<
            ArgumentDefinition<N, true, ParsedType>,
            'optional' | 'positional'
        >
    ) {
        return this.argument({
            ...argumentDefinition,
            optional: true,
            positional: false,
        })
    }

    flag<N extends string, ParsedType>(
        args: Omit<
            ArgumentDefinition<N, true, ParsedType>,
            'parser' | 'optional' | 'positional'
        >
    ) {
        return this.argument({
            ...args,
            parser: SingletonFlagParser,
            optional: true,
            positional: false,
        })
    }

    /**
     * Positional arguments keep the order they are defined, but they are split between
     * optional arguments and required arguments.
     *
     * ```ts
     *   CommandBuilder.new('test')
     *       .positional({ name: 'one', description: 'description' })
     *       .positional({ name: 'two', description: 'description', optional: true })
     *       .positional({ name: 'three', description: 'description' })
     * ```
     * Will result in the command: `test one three [two]`
     */
    positional<N extends string, Opt extends boolean, ParsedType>(
        args: Omit<
            ArgumentDefinition<N, Opt, ParsedType>,
            'positional' | 'optional'
        > & { optional?: Opt }
    ) {
        const optional = args.optional ?? true
        return this.argument({
            ...args,
            positional: true,
            optional,
        })
    }

    private organizeArguments(
        args: ArgumentDefinition<any, any, any>[]
    ): Result<CommandDefinition<any>['arguments'], CommandBuildError> {
        const positionalRequired = []
        const positionalOptional = []
        const namedMap = new Map()
        for (const argument of args) {
            switch (true) {
                case argument.positional && argument.optional:
                    positionalOptional.push(argument)
                    break
                case argument.positional:
                    positionalRequired.push(argument)
                    break
                default:
                    if (namedMap.has(argument.name)) {
                        return Results.error({
                            kind: 'duplicate_flag_name',
                            name: argument.name,
                        })
                    }
                    namedMap.set(argument.name, argument)
            }
        }
        return {
            positional: positionalRequired.concat(positionalOptional),
            named: namedMap,
        }
    }

    build(
        callback: CommandFunction<Args>
    ): Result<
        CommandDefinition<ArgumentDefinition<any, any, any>[]>,
        CommandBuildError
    > {
        const args = this.organizeArguments(this.arguments)
        if (Results.isErr(args)) {
            return args
        }
        return {
            identifier: this.identifier,
            arguments: args,
            callback,
        }
    }
}
