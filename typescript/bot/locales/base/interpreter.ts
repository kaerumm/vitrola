import type { LocaleSubmodule } from '.'

export const interpreter = {
    kind: 'locale_submodule',
    definitions: {
        commander_command_failed: `Failed to execute command!`,
        tokenizer_unfinished_string: `Syntax Error: Unterminated string`,
        tokenizer_unfinished_string_hint: (delimiter: `"` | `'`) =>
            `Insert the missing \`${delimiter}\` to end the string`,
        unknownCommand: (name: string) => `Command ${name} does not exist`,
        invalidArgument: (argumentName: string, argumentValue: string) =>
            `Invalid argument value "${argumentValue}" for argument "${argumentName}"`,
        missingRequiredArgument: (argumentName: string) =>
            `Missing required argument "${argumentName}"`,
        flagParserHint: `...I have no clue how you managed to see this message. Flag parameters takes no arguments.`,
        parser_unexpected_token: (token: string) =>
            `Syntax Error: Unexpected token '${token}'.`,
        parser_unexpected_token_hint: (token: string) =>
            `The token '${token}' is either in an invalid position or is not allowed by the syntax.`,
        parser_binary_expression_rhs_missing: `Syntax Error: Missing the right hand side expression of a binary expression`,
        parser_binary_expression_rhs_missing_hint: `Insert an expression here`,
        parser_expected_group_closer: (closer: string) =>
            `Syntax Error: Missing group closer '${closer}'`,
        parser_expected_group_closer_hint: (closer: string) =>
            `Insert '${closer}' here`,
        commander_no_alias_trees: `Could not resolve command as there are no available Alias Tree`,
        commander_no_alias_trees_hint: `This is definitely a bug and should be reported!`,
        commander_command_not_found: (args: string[]) =>
            `Could not execute \`${args.join(' ')}\``,
        commander_command_not_found_hint: (name: string) =>
            `There is no command named ${name}.`,
        commander_required_argument: (argument: string, description: string) =>
            `Missing required argument ${argument}: ${description}`,
        commander_required_argument_hint: `Redo the command passing the required argument`,
        command_string_parser_missing_value: `Missing string argument`,
        command_string_parser_missing_value_hint:
            `Insert a string here, a string can be any sequence of characters` +
            `that end on whitespace or a \" delimited sequence of characters like \"this is a string\"`,
        testing_unreachable: `If you are reading this I sure hope you are a developer doing some testing, otherwise please report this as a bug!`,
        command_number_parser_invalid_value: `Not a valid number value!`,
        command_number_parser_invalid_value_hint: (examples: string[]) =>
            `A number argument must be a parseable integer or float, i.e: ${examples.map((e) => `'${e}'`).join(' ')}`,
        command_number_parser_missing_value: `Missing number argument`,
        command_number_parser_missing_value_hint: (examples: string[]) =>
            `Insert a number here, a number must be either a float or an integer like: ` +
            `${examples.map((e) => `'${e}'`).join(' ')}`,
    },
} satisfies LocaleSubmodule
