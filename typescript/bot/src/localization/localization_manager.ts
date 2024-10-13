/**
 * Localization implementation, base locale is used to both always have some text and avoid using keys
 * as text replacement when a locale is missing and to act as a strict typing for locales.
 *
 * Locales may be incomplete in relation to the base locale, but they must never have extra definitions,
 * this restriction exists so as to keep file sizes to be only as big as they need to.
 */
import type { FollowPath, ObjectKeyPaths } from 'commons/lib/types/objects.ts'
import type { BotError } from 'commons/lib/utils/error.ts'
import type { Logger } from 'commons/lib/log.ts'
import type { AsyncInitializer } from '../types/initialization.ts'
import {
    LocaleEntry,
    LocaleSubmodule,
    modules,
} from '../../locales/base/index.ts'
import { GenericCache } from 'commons/lib/data-structures/cache.ts'
import { Option } from 'commons/lib/utils/option.ts'
import { Results, type Result } from 'commons/lib/utils/result.ts'
import * as fs from 'fs/promises'
import * as path from 'path'
import type {
    ArgumentsOf,
    KeysMatchingSubtype,
} from 'commons/lib/types/utils.ts'
import {
    AllLocalesAreValid,
    AvailableLocales,
    BaseLocale,
} from './locale_validation.ts'
import { tryFollow } from 'commons/lib/utils/objects.ts'

const localeDir = 'locales/'

type LocalePathMap = Record<string, Record<string, string>>

export class LocalizationManagerInitializer
    implements AsyncInitializer<LocalizationManager, BotError>
{
    public async initialize(
        deps: Omit<
            ConstructorParameters<typeof LocalizationManager>[number],
            'localePaths'
        >
    ): Promise<Result<LocalizationManager, BotError>> {
        return Results.map(
            await this.discoverLocales(deps.logger),
            (localePaths) =>
                new LocalizationManager({
                    localePaths,
                    ...deps,
                })
        )
    }

    private async discoverLocales(
        logger: Logger
    ): Promise<Result<LocalePathMap, BotError>> {
        const pathMap = {} as LocalePathMap
        const locales = await fs.readdir(localeDir, {
            withFileTypes: true,
        })
        for (const dirent of locales.filter(
            (d) => d.isDirectory() && d.name !== 'base'
        )) {
            const localePath = path.join(localeDir, dirent.name)
            logger.info(`Found locale ${dirent.name} at path ${localePath} `)
            const locale = (
                await fs.readdir(localePath, {
                    withFileTypes: true,
                })
            )
                .filter(
                    (f) =>
                        f.isFile() &&
                        f.name.endsWith('.ts') &&
                        !f.name.endsWith('.d.ts')
                )
                .reduce(
                    (obj, val) => {
                        const name = val.name.replace('.ts', '')
                        const submodulePath = path.resolve(
                            path.join(localePath, val.name)
                        )
                        logger.debug(
                            `Found submodule ${name} at path ${submodulePath}`
                        )
                        obj[name] = submodulePath
                        return obj
                    },
                    {} as Record<string, string>
                )
            pathMap[dirent.name] = locale
        }
        return pathMap
    }
}

export class LocalizationManager {
    private baseLocale = modules
    private submoduleCache = new GenericCache<any>()
    // This exists to create a typescript error if some locale definition is not valid
    private _allLocalesAreValid: AllLocalesAreValid = true

    constructor(
        private deps: {
            localePaths: LocalePathMap
            logger: Logger
        }
    ) {}

    async getSubmodule<Submodule extends keyof BaseLocale>(
        locale: AvailableLocales,
        submodule: Submodule
    ): Promise<Result<BaseLocale[Submodule], BotError>> {
        if (locale === 'en_us') {
            return this.baseLocale[submodule] as Result<
                BaseLocale[Submodule],
                BotError
            >
        }
        const submodules = this.deps.localePaths[locale]
        if (!submodules) {
            return {
                error: {
                    kind: 'warning',
                    message: `Locale \`${locale}\` not found`,
                },
            }
        }
        const submodulePath = submodules[submodule]
        if (!submodulePath) {
            return {
                error: {
                    kind: 'warning',
                    message: `Submodule \`${submodule}\` for locale \`${locale}\` not found`,
                },
            }
        }
        const key = `${locale}#${submodule}`
        let submodul = this.submoduleCache.get(key)
        if (!submodul) {
            try {
                const javascriptModule = await import(submodulePath)
                if (!javascriptModule || !javascriptModule[submodule]) {
                    return {
                        error: {
                            kind: 'warning',
                            message:
                                `Could not find an exported field named \`${submodule}\` within the module exported by` +
                                `the file \`${submodulePath}\``,
                        },
                    }
                }
                this.submoduleCache.set(key, javascriptModule[submodule])
                submodul = javascriptModule[submodule]
            } catch (error: unknown) {
                return {
                    error: {
                        kind: 'warning',
                        message: `Unexpected error trying to get ${submodule} for ${locale}: ${error}`,
                    },
                }
            }
        }
        return submodul as Result<BaseLocale[Submodule], BotError>
    }

    /**
     * Returns either a string or a function for the specified locale, there are no runtime checks for
     * valid input, instead we trust the type safety, so do not ignore the typing of this function.
     */
    async get<
        Locale extends AvailableLocales,
        Module extends KeysMatchingSubtype<BaseLocale, LocaleSubmodule>,
        Key extends ObjectKeyPaths<BaseLocale[Module]['definitions']>,
    >(
        locale: Locale,
        moduleKey: Module,
        key: Key
    ): Promise<FollowPath<BaseLocale[Module]['definitions'], Key>> {
        const path = key.split('.')
        const result = await this.getSubmodule(locale, moduleKey)
        if (Results.isErr(result)) {
            this.deps.logger.warn(result.error.message)
        }
        const submodule = Results.orElse(result, this.baseLocale[moduleKey])
        // Type constraint safety ensures that the path we pass in takes us to a valid value
        return (tryFollow(submodule['definitions'], path) ??
            tryFollow(
                this.baseLocale[moduleKey].definitions,
                path
            )) as unknown as FollowPath<BaseLocale[Module]['definitions'], Key>
    }

    static lazy<
        Module extends KeysMatchingSubtype<BaseLocale, LocaleSubmodule>,
        Key extends ObjectKeyPaths<BaseLocale[Module]['definitions']>,
    >(
        module: Module,
        key: Key,
        args: StringOrLazyLocale<
            ArgumentsOf<FollowPath<BaseLocale[Module]['definitions'], Key>>
        >
    ) {
        return new LazyLocale(module, key, args)
    }
}

type StringOrLazyLocale<T> = T extends any[]
    ? {
          [Key in keyof T]: T[Key] extends string
              ?
                    | string
                    | LazyLocale<
                          KeysMatchingSubtype<BaseLocale, LocaleSubmodule>,
                          ObjectKeyPaths<
                              BaseLocale[KeysMatchingSubtype<
                                  BaseLocale,
                                  LocaleSubmodule
                              >]['definitions']
                          >
                      >
              : T[Key]
      }
    : undefined

// keyof this must properly return keys instead of never
declare const T: BaseLocale[KeysMatchingSubtype<
    BaseLocale,
    LocaleSubmodule
>]['definitions']
/**
 * This class is meant to be used when the locale needs to be eventually resolved
 */
export class LazyLocale<
    Module extends KeysMatchingSubtype<
        BaseLocale,
        LocaleSubmodule
    > = KeysMatchingSubtype<BaseLocale, LocaleSubmodule>,
    K extends ObjectKeyPaths<
        BaseLocale[Module]['definitions']
    > = ObjectKeyPaths<BaseLocale[Module]['definitions']>,
> {
    private args: (
        | string
        | LazyLocale<KeysMatchingSubtype<BaseLocale, LocaleSubmodule>, any>
    )[]

    constructor(
        private module: Module,
        private key: K,
        args: StringOrLazyLocale<
            ArgumentsOf<FollowPath<BaseLocale[Module]['definitions'], K>>
        >
    ) {
        this.args = args as typeof this.args
    }

    async resolve<Locale extends AvailableLocales>(
        locale: Locale,
        localizationManager: LocalizationManager
    ): Promise<string> {
        const localization = await localizationManager.get(
            locale,
            this.module,
            this.key
        )
        if (typeof localization === 'function') {
            if (this.args) {
                const resolvedArgs = await Promise.all(
                    this.args.map((a) =>
                        a instanceof LazyLocale
                            ? a.resolve(locale, localizationManager)
                            : Promise.resolve(a)
                    )
                )
                return (localization as (...args: string[]) => string)(
                    ...resolvedArgs
                )
            }
            return (localization as () => string)()
        }
        return localization as string
    }
}
