import { Results } from 'commons/lib/utils/result.ts'
import { type Command } from '../command.ts'
import { ArgumentParser, CommandBuilder } from '../command_builder.ts'
import { ASTUnit } from '../language/ast.ts'

export class PingCommand implements Command {
    buildDefinition() {
        return CommandBuilder.new('ping')
            .flag({ name: 'reply', description: 'if it replies' })
            .named({
                name: 'oh shit',
                description: 'shit happens',
                parser: null as unknown as ArgumentParser<number>,
            })
            .build(async function execute(args, deps) {
                return Results.ok(ASTUnit)
            })
    }
}
