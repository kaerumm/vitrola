import type { interpreter as baseInterpreter } from '../base/interpreter'

export const interpreter = {
    kind: 'locale_submodule',
    definitions: {
        commander_command_failed: `Felipeeeee meu PC não tá ligando!!!`,
        tokenizer_unfinished_string: `Erro de sintaxe: String não finalizada`,
        tokenizer_unfinished_string_hint: (delimiter: `"` | `'`) =>
            `Adicione a \`${delimiter}\` que está faltando para finalizar a string.`,
        unknownCommand: (name: string) => `O comando ${name} não existe`,
        invalidArgument: (argumentName: string, argumentValue: string) =>
            `Valor inválido "${argumentValue}" para o argumento "${argumentName}".`,
        missingRequiredArgument: (argumentName: string) =>
            `O argumento "${argumentName}" é obrigatório, mas não foi passado.`,
        flagParserHint:
            '...O maior mistério é como essa mensagem chegou até você. Paramêtros do tipo flag não aceitam argumentos. ',
        parser_unexpected_token: (token: string) =>
            `Erro de sintaxe: Token inesperado '${token}'.`,
        parser_unexpected_token_hint: (token: string) =>
            `O token '${token}' ou está numa posição inválida ou não é permitida pela sintaxe`,
        parser_binary_expression_rhs_missing: `Erro de Sintaxe: Faltando uma expressão no lado direito de uma expressão binária`,
        parser_binary_expression_rhs_missing_hint: `Adicione uma expressão aqui`,
        parser_expected_group_closer: (closer: string) =>
            `Erro de Sintaxe: Faltando '${closer} para fechar agrupamento'`,
        parser_expected_group_closer_hint: (closer: string) =>
            `Adicione '${closer}' aqui`,
        commander_no_alias_trees: `Não foi possível resolver o comando pois não existem Alias Trees disponíveis`,
        commander_no_alias_trees_hint: `Isso é definitivamente um bug e deve ser relatado!`,
        commander_command_not_found: (args: string[]) =>
            `Não foi possível executar \`${args.join(' ')}\``,
        commander_command_not_found_hint: (name: string) =>
            `Não existe um comando chamado ${name}`,
        commander_required_argument: (argument: string, description: string) =>
            `Faltando argumento obrigatório ${argument}: ${description}`,
        commander_required_argument_hint: `Refaça o comando passando o argumento obrigatório`,
        command_string_parser_missing_value: `Faltando argumento do tipo texto`,
        command_string_parser_missing_value_hint:
            `Insira texto aqui, um texto 'e uma sequencia de caracteres'` +
            `terminada com espa'co branco ou uma sequ^encia de caracteres delimitada por \",` +
            ` como por exemplo \"isso 'e um texto'\"`,
        testing_unreachable: `Se tu n~ao for um dev, deu ruim.`,
        command_number_parser_invalid_value: `Valor n'umerico inv'alido`,
        command_number_parser_invalid_value_hint: (examples: string[]) =>
            `Um argumento de n'umero deve ser um n'umero inteiro ou decimal, ex: ${examples.map((e) => `'${e}'`).join(' ')}`,
        command_number_parser_missing_value: `Faltando argumento do tipo numerico`,
        command_number_parser_missing_value_hint: (examples: string[]) =>
            `Insira um numero aqui, um n'umero deve ser ou um n'umero inteiro ou um n'umero decimal como: ` +
            `${examples.map((e) => `'${e}'`).join(' ')}`,
    },
} satisfies typeof baseInterpreter
