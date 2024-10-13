import { Results } from 'commons/lib/utils/result.ts'
import { type Command } from '../command.ts'
import { CommandBuilder } from '../command_builder.ts'
import { ASTUnit } from '../language/ast.ts'
import { Logger } from 'commons/lib/log.ts'

export class PingCommand implements Command {
    constructor(private deps: { logger: Logger }) {}

    buildDefinition() {
        return CommandBuilder.new('ping').build(
            async function execute(_args, _) {
                return Results.ok(ASTUnit)
            }
        )
    }
}
