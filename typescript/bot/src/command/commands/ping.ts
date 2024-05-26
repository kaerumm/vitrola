import { Results } from 'commons/lib/utils/result.ts'
import { type Command } from '../command.ts'
import { ArgumentParser, CommandBuilder } from '../command_builder.ts'
import { ASTUnit } from '../language/ast.ts'
import { Logger } from 'commons/lib/log.ts'
import { StringParser } from '../parsers/string.ts'

export class PingCommand implements Command {
    constructor(private deps: { logger: Logger }) {}

    buildDefinition() {
        const deps = this.deps
        return CommandBuilder.new('ping')
            .flag({ name: 'reply', description: 'if it replies' })
            .positional({
                name: 'who',
                description: 'who to ping',
                parser: new StringParser(),
            })
            .build(async function execute(args, _) {
                deps.logger.info(
                    `Hi! ${args.who}, should you reply? ${args.reply}`
                )
                return Results.ok(ASTUnit)
            })
    }
}
