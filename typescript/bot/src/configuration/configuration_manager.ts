import { Result, ValueResult } from 'commons/lib/utils/result'
import { AvailableLocales } from '../localization/locale_validation'

export interface GuildConfigurations {
    commandPrefix: string
}

export interface UserConfigurations {
    locales: AvailableLocales[]
}

export type ConfigurationManagerError = void

export class ConfigurationManager {
    async user<T extends keyof UserConfigurations>(
        id: string,
        configuration: T
    ): Promise<Result<UserConfigurations[T], ConfigurationManagerError>> {
        return ['en_us'] as ValueResult<UserConfigurations[T]>
    }

    async guild<T extends keyof GuildConfigurations>(
        id: string,
        configuration: T
    ): Promise<Result<GuildConfigurations[T], ConfigurationManagerError>> {
        return '#' as ValueResult<GuildConfigurations[T]>
    }
}
