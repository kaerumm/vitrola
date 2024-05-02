import type { LocaleSubmodule } from '.'

export const interpreter = {
    kind: 'locale_submodule',
    definitions: {
        unfinishedString: (token: `"` | `'`, value: string) =>
            `Unfinished string \`${token}${value.substring(0, 12)}...${value.substring(value.length - 12, value.length)}\` missing ${token} to end the string`,
        unknownCommand: (name: string) => `Command ${name} does not exist`,
        invalidArgument: (
            argumentName: string,
            argumentValue: string,
            surroundingSource: string,
            hint: string
        ) =>
            `Invalid argument value "${argumentValue}" for argument "${argumentName}": "${surroundingSource}${argumentValue}"\v<- THIS
Hint: ${hint}
`,
        missingRequiredArgument: (
            argumentName: string,
            source: string,
            hint: string
        ) =>
            `Missing required argument "${argumentName}": "${source} [HERE] <-"
Hint: ${hint}
`,
        flagParserHint: `...I have no clue how you managed to see this message. Flag parameters takes no arguments.`,
    },
} satisfies LocaleSubmodule
