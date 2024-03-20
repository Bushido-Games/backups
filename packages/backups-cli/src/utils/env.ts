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

  private static readonly vaultCache: { [cacheKey: string]: string } = {}

  private static tokens: {
    [environment in EnvironmentType]: EnvironmentTokens | null
  }

  private static apiHosts: { [environment in EnvironmentType]: string } = {
    [EnvironmentType.LOCAL]: `http://${this.LOCAL_API_ADDRESS}:3000`,
    [EnvironmentType.STAGING]: process.env.STAGING_API_HOST,
    [EnvironmentType.PRODUCTION]: process.env.PRODUCTION_API_HOST,
  }

  private static backupApiHosts: { [environment in EnvironmentType]: string } =
    {
      [EnvironmentType.LOCAL]: `http://${this.LOCAL_API_ADDRESS}:3010`,
      [EnvironmentType.STAGING]: process.env.STAGING_BACKUP_API_HOST,
      [EnvironmentType.PRODUCTION]: process.env.PRODUCTION_BACKUP_API_HOST,
    }

  private static async loadFromVault(
    environment: EnvironmentType,
    name: string,
    separateVault: boolean
  ): Promise<string | null> {
    const spinner = ora()

    const projectName = `${process.env.PROJECT_NAME}${
      separateVault ? '-backups' : ''
    }`

    const displayName = `${environment}-${projectName}`

    spinner.start(
      `Please wait, obtaining keys for ${displayName} from Vault...`
    )

    const fullName = [process.env.CLI_PREFIX, environment, projectName, name]
      .join('_')
      .replaceAll('-', '_')
      .toUpperCase()

    if (!this.vaultCache[displayName]) {
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
        spinner.fail(
          `Unable to obtain keys for ${displayName} from Vault! You may not have the required permissions.`
        )
        return null
      }
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

  public static async loadAllFromVault() {
    this.tokens = {
      [EnvironmentType.LOCAL]: {
        getHealth:
          (await this.loadFromVault(
            EnvironmentType.LOCAL,
            'BACKUPS_GET_HEALTH_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.LOCAL,
            'BACKUPS_GET_HEALTH_TOKEN',
            true
          )),
        createBackup:
          (await this.loadFromVault(
            EnvironmentType.LOCAL,
            'BACKUPS_CREATE_BACKUP_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.LOCAL,
            'BACKUPS_CREATE_BACKUP_TOKEN',
            true
          )),
        restoreBackup:
          (await this.loadFromVault(
            EnvironmentType.LOCAL,
            'BACKUPS_RESTORE_BACKUP_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.LOCAL,
            'BACKUPS_RESTORE_BACKUP_TOKEN',
            true
          )),
        deleteBackup:
          (await this.loadFromVault(
            EnvironmentType.LOCAL,
            'BACKUPS_DELETE_BACKUP_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.LOCAL,
            'BACKUPS_DELETE_BACKUP_TOKEN',
            true
          )),
        importUsers:
          (await this.loadFromVault(
            EnvironmentType.LOCAL,
            'BACKUPS_IMPORT_USERS_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.LOCAL,
            'BACKUPS_IMPORT_USERS_TOKEN',
            true
          )),
      },
      [EnvironmentType.STAGING]: {
        getHealth:
          (await this.loadFromVault(
            EnvironmentType.STAGING,
            'BACKUPS_GET_HEALTH_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.STAGING,
            'BACKUPS_GET_HEALTH_TOKEN',
            true
          )),
        createBackup:
          (await this.loadFromVault(
            EnvironmentType.STAGING,
            'BACKUPS_CREATE_BACKUP_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.STAGING,
            'BACKUPS_CREATE_BACKUP_TOKEN',
            true
          )),
        restoreBackup:
          (await this.loadFromVault(
            EnvironmentType.STAGING,
            'BACKUPS_RESTORE_BACKUP_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.STAGING,
            'BACKUPS_RESTORE_BACKUP_TOKEN',
            true
          )),
        deleteBackup:
          (await this.loadFromVault(
            EnvironmentType.STAGING,
            'BACKUPS_DELETE_BACKUP_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.STAGING,
            'BACKUPS_DELETE_BACKUP_TOKEN',
            true
          )),
        importUsers:
          (await this.loadFromVault(
            EnvironmentType.STAGING,
            'BACKUPS_IMPORT_USERS_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.STAGING,
            'BACKUPS_IMPORT_USERS_TOKEN',
            true
          )),
      },
      [EnvironmentType.PRODUCTION]: {
        getHealth:
          (await this.loadFromVault(
            EnvironmentType.PRODUCTION,
            'BACKUPS_GET_HEALTH_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.PRODUCTION,
            'BACKUPS_GET_HEALTH_TOKEN',
            true
          )),
        createBackup:
          (await this.loadFromVault(
            EnvironmentType.PRODUCTION,
            'BACKUPS_CREATE_BACKUP_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.PRODUCTION,
            'BACKUPS_CREATE_BACKUP_TOKEN',
            true
          )),
        restoreBackup:
          (await this.loadFromVault(
            EnvironmentType.PRODUCTION,
            'BACKUPS_RESTORE_BACKUP_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.PRODUCTION,
            'BACKUPS_RESTORE_BACKUP_TOKEN',
            true
          )),
        deleteBackup:
          (await this.loadFromVault(
            EnvironmentType.PRODUCTION,
            'BACKUPS_DELETE_BACKUP_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.PRODUCTION,
            'BACKUPS_DELETE_BACKUP_TOKEN',
            true
          )),
        importUsers:
          (await this.loadFromVault(
            EnvironmentType.PRODUCTION,
            'BACKUPS_IMPORT_USERS_TOKEN',
            false
          )) ??
          (await this.loadFromVault(
            EnvironmentType.PRODUCTION,
            'BACKUPS_IMPORT_USERS_TOKEN',
            true
          )),
      },
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
