import { Results } from 'commons/lib/utils/result.ts'
import { type Command } from '../command.ts'
import { ArgumentParser, CommandBuilder } from '../command_builder.ts'
import { ASTUnit } from '../language/ast.ts'
import { Logger } from 'commons/lib/log.ts'

export class PingCommand implements Command {
    constructor(private deps: { logger: Logger }) {}

    buildDefinition() {
        const deps = this.deps
        return CommandBuilder.new('ping')
            .flag({ name: 'reply', description: 'if it replies' })
            .build(async function execute(args, _) {
                deps.logger.info('Hi!', args)
                return Results.ok(ASTUnit)
            })
    }
}
