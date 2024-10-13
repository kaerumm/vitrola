import { Result, Results } from 'commons/lib/utils/result'
import { LazyLocale } from '../localization/localization_manager'
import { Interpreter, InterpreterEnvironment } from './language/interpreter'
import { Tokenizer } from './language/tokenizer'
import { Parser } from './language/parser'

export interface DSLError {
    kind: 'command_failed'
    line: number
    column: number
    sourceLine: string
    errorMessage: LazyLocale
    hint: LazyLocale
}

export type PartialDSLError = Pick<DSLError, 'errorMessage' | 'hint'>

export class Commander {
    constructor() {}

    /**
     * @param source A string that is to be tokenized and parsed into an executable AST tree
     * @param aliasTrees An ordered array of alias trees that are used to resolve which commands are available
     */
    async tryExecute(
        source: string,
        commandContext: InterpreterEnvironment['commandContext']
    ): Promise<Result<void, DSLError[]>> {
        const tokenized = Results.mapError(
            Tokenizer.tokenize(source),
            (error) =>
                error.errors.map((syntaxError) =>
                    Tokenizer.intoDSLError(source, syntaxError, error.newlines)
                )
        )
        if (Results.isErr(tokenized)) {
            return tokenized
        }
        const parsed = Results.mapError(
            Parser.parse(tokenized.spans),
            (errors) =>
                errors.map((parserError) =>
                    Parser.intoDSLError(
                        tokenized.spans,
                        parserError,
                        tokenized.newlines,
                        source
                    )
                )
        )
        if (Results.isErr(parsed)) {
            return parsed
        }
        const result = await Interpreter.interpret(parsed, {
            commandContext,
        })
        if (Results.isErr(result)) {
            console.log(JSON.stringify(result, null, 4))
            const startingSourcePosition =
                tokenized.spans[result.error.node.tokenRange[0]]
                    .sourcePosition[0]
            const endingSourcePosition =
                tokenized.spans[result.error.node.tokenRange[1]]
                    .sourcePosition[1]
            const columnLineSource = Tokenizer.columnLineSourceForTokenRange(
                startingSourcePosition,
                endingSourcePosition,
                tokenized.newlines,
                source
            )
            return {
                error: [
                    {
                        kind: 'command_failed',
                        ...result.error.partialDSLError,
                        ...columnLineSource,
                    },
                ],
            }
        }
    }
}
