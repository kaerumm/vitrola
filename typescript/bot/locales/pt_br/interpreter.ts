import type { interpreter as baseInterpreter } from '../base/interpreter'

export const interpreter = {
    kind: 'locale_submodule',
    definitions: {
        unfinishedString: (token: '"' | "'", value: string) =>
            `String não finalizada \`${token}${value}\`, faltou ${token} para indicar o fim da string`,
        unknownCommand: (name: string) => `Comando '${name}' não existe`,
        invalidArgument: () => `:)`,
        missingRequiredArgument: () => ``,
        flagParserHint:
            '...O maior mistério é como essa mensagem chegou até você. Paramêtros do tipo flag não aceitam argumentos. ',
    },
} satisfies typeof baseInterpreter
