import { Result } from 'commons/lib/utils/result'
import type { CommandBuildError, CommandDefinition } from './command_builder.ts'

export interface Command {
    buildDefinition(): Result<CommandDefinition<any>, CommandBuildError>
}
