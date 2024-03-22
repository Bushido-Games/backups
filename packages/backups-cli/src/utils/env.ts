import * as ora from 'ora'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { EnvironmentType } from 'src/types'

export enum TokenType {
  GET_HEALTH = 'get-health',
  CREATE_BACKUP = 'create-backup',
  RESTORE_BACKUP = 'restore-backup',
  DELETE_BACKUP = 'delete-backup',
  IMPORT_USERS = 'import-users',
}

interface EnvironmentTokens {
  getHealth: string | null
  createBackup: string | null
  restoreBackup: string | null
  deleteBackup: string | null
  importUsers: string | null
}

export class Environment {
  private static readonly LOCAL_API_ADDRESS = existsSync('/.dockerenv')
    ? 'host.docker.internal'
    : 'localhost'

  public static readonly EXPERT_MODE = existsSync(
    `${homedir()}/.backups-cli-expert-mode`
  )

  private static readonly vaultCache: { [cacheKey: string]: string | null } = {}

  private static readonly tokens: {
    [environment in EnvironmentType]: EnvironmentTokens | null
  }

  private static readonly apiHosts: {
    [environment in EnvironmentType]: string
  } = {
    [EnvironmentType.LOCAL]: `http://${this.LOCAL_API_ADDRESS}:3000`,
    [EnvironmentType.STAGING]: process.env.STAGING_API_HOST,
    [EnvironmentType.PRODUCTION]: process.env.PRODUCTION_API_HOST,
  }

  private static readonly backupApiHosts: {
    [environment in EnvironmentType]: string
  } = {
    [EnvironmentType.LOCAL]: `http://${this.LOCAL_API_ADDRESS}:3010`,
    [EnvironmentType.STAGING]: process.env.STAGING_BACKUP_API_HOST,
    [EnvironmentType.PRODUCTION]: process.env.PRODUCTION_BACKUP_API_HOST,
  }

  private static readonly projectNames: string[] =
    process.env.PROJECT_NAMES.split(',').map((projectName: string): string =>
      projectName.trim()
    )

  private static async loadFromSingleVault(
    environment: EnvironmentType,
    projectName: string,
    variableName: string
  ): Promise<string | null> {
    const spinner = ora()

    const displayName = [environment, projectName].join('-')

    spinner.start(
      `Please wait, obtaining keys for ${displayName} from Vault...`
    )

    const fullName = [
      process.env.CLI_PREFIX,
      environment,
      projectName,
      variableName,
    ]
      .join('_')
      .replaceAll('-', '_')
      .toUpperCase()

    if (!Object.hasOwn(this.vaultCache, displayName)) {
      try {
        const { stdout } = await promisify(execFile)('envvault', [
          '-p',
          projectName,
          '-e',
          environment,
          'env',
        ])

        this.vaultCache[displayName] = stdout
      } catch {
        this.vaultCache[displayName] = null
      }
    }

    if (this.vaultCache[displayName] === null) {
      spinner.fail(
        `Unable to obtain keys for ${displayName} from Vault! You may not have the required permissions.`
      )
      return null
    }

    const matchingVariables = this.vaultCache[displayName]
      .split('\n')
      .filter((line: string): boolean => line.trim().startsWith(fullName))

    if (matchingVariables.length < 1) {
      throw new Error(
        `Got access to variables, but unable to find one named ${fullName}!`
      )
    }

    const result = matchingVariables[0].replace(`${fullName}=`, '').trim()

    spinner.succeed(`Successfully obtained keys for ${displayName} from Vault!`)

    return result
  }

  private static async loadFromAllVaults(
    environment: EnvironmentType,
    variableName: string
  ): Promise<string | null> {
    for (const projectName of this.projectNames) {
      const result = await this.loadFromSingleVault(
        environment,
        projectName,
        variableName
      )

      if (result !== null) {
        return result
      }
    }

    return null
  }

  public static async loadTokens() {
    for (const environment of Object.values(EnvironmentType)) {
      this.tokens[environment] = {
        getHealth: await this.loadFromAllVaults(
          environment,
          'BACKUPS_GET_HEALTH_TOKEN'
        ),
        createBackup: await this.loadFromAllVaults(
          environment,
          'BACKUPS_CREATE_BACKUP_TOKEN'
        ),
        restoreBackup: await this.loadFromAllVaults(
          environment,
          'BACKUPS_RESTORE_BACKUP_TOKEN'
        ),
        deleteBackup: await this.loadFromAllVaults(
          environment,
          'BACKUPS_DELETE_BACKUP_TOKEN'
        ),
        importUsers: await this.loadFromAllVaults(
          environment,
          'BACKUPS_IMPORT_USERS_TOKEN'
        ),
      }
    }
  }

  public static getToken(
    environment: EnvironmentType,
    tokenType: TokenType
  ): string | null {
    switch (tokenType) {
      case TokenType.GET_HEALTH:
        return this.tokens[environment].getHealth

      case TokenType.CREATE_BACKUP:
        return this.tokens[environment].createBackup

      case TokenType.RESTORE_BACKUP:
        return this.tokens[environment].restoreBackup

      case TokenType.DELETE_BACKUP:
        return this.tokens[environment].deleteBackup

      case TokenType.IMPORT_USERS:
        return this.tokens[environment].importUsers

      default:
        return null
    }
  }

  public static getApiHost(environment: EnvironmentType): string {
    return this.apiHosts[environment]
  }

  public static getBackupApiHost(environment: EnvironmentType): string {
    return this.backupApiHosts[environment]
  }
}
