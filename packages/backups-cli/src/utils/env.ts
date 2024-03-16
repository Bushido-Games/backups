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

  private static tokens: {
    [environment in EnvironmentType]:
      | {
          [environment in EnvironmentType]: EnvironmentTokens
        }
      | null
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
    name: string
  ): Promise<string | null> {
    const spinner = ora()

    spinner.start(`Please wait, obtaining key for ${environment} from Vault...`)

    const fullName = [
      process.env.CLI_PREFIX,
      environment,
      process.env.PROJECT_NAME,
      name,
    ]
      .join('_')
      .replaceAll('-', '_')
      .toUpperCase()

    let output: string

    try {
      const { stdout } = await promisify(execFile)('envvault', [
        '-p',
        process.env.PROJECT_NAME,
        '-e',
        environment,
        'env',
      ])

      output = stdout
    } catch {
      spinner.fail(
        `Unable to obtain key for ${environment} from Vault! You may not have the required permissions.`
      )
      return null
    }

    const matchingVariables = output
      .split('\n')
      .filter((line: string): boolean => line.trim().startsWith(fullName))

    if (matchingVariables.length < 1) {
      throw new Error(
        `Got access to variables, but unable to find one named ${fullName}!`
      )
    }

    const result = matchingVariables[0].replace(`${fullName}=`, '').trim()

    spinner.succeed(`Successfully obtained key for ${environment} from Vault!`)

    return result
  }

  public static async loadAllFromVault() {
    this.tokens = {
      [EnvironmentType.LOCAL]: JSON.parse(
        await this.loadFromVault(
          EnvironmentType.LOCAL,
          process.env.ENV_VAR_NAME
        )
      ),
      [EnvironmentType.STAGING]: JSON.parse(
        await this.loadFromVault(
          EnvironmentType.STAGING,
          process.env.ENV_VAR_NAME
        )
      ),
      [EnvironmentType.PRODUCTION]: JSON.parse(
        await this.loadFromVault(
          EnvironmentType.PRODUCTION,
          process.env.ENV_VAR_NAME
        )
      ),
    }
  }

  public static getToken(
    environment: EnvironmentType,
    tokenType: TokenType
  ): string | null {
    switch (tokenType) {
      case TokenType.GET_HEALTH:
        return (
          this.tokens[EnvironmentType.LOCAL]?.[environment].getHealth ??
          this.tokens[EnvironmentType.STAGING]?.[environment].getHealth ??
          this.tokens[EnvironmentType.PRODUCTION]?.[environment].getHealth ??
          null
        )

      case TokenType.CREATE_BACKUP:
        return (
          this.tokens[EnvironmentType.LOCAL]?.[environment].createBackup ??
          this.tokens[EnvironmentType.STAGING]?.[environment].createBackup ??
          this.tokens[EnvironmentType.PRODUCTION]?.[environment].createBackup ??
          null
        )

      case TokenType.RESTORE_BACKUP:
        return (
          this.tokens[EnvironmentType.LOCAL]?.[environment].restoreBackup ??
          this.tokens[EnvironmentType.STAGING]?.[environment].restoreBackup ??
          this.tokens[EnvironmentType.PRODUCTION]?.[environment]
            .restoreBackup ??
          null
        )

      case TokenType.DELETE_BACKUP:
        return (
          this.tokens[EnvironmentType.LOCAL]?.[environment].deleteBackup ??
          this.tokens[EnvironmentType.STAGING]?.[environment].deleteBackup ??
          this.tokens[EnvironmentType.PRODUCTION]?.[environment].deleteBackup ??
          null
        )

      case TokenType.IMPORT_USERS:
        return (
          this.tokens[EnvironmentType.LOCAL]?.[environment].importUsers ??
          this.tokens[EnvironmentType.STAGING]?.[environment].importUsers ??
          this.tokens[EnvironmentType.PRODUCTION]?.[environment].importUsers ??
          null
        )

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
