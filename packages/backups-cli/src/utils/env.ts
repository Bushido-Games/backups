import * as ora from 'ora'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { EnvironmentType } from 'src/types'

export class Environment {
  private static readonly LOCAL_API_ADDRESS = existsSync('/.dockerenv')
    ? 'host.docker.internal'
    : 'localhost'

  public static readonly EXPERT_MODE = existsSync(
    `${homedir()}/.backups-cli-expert-mode`
  )

  private static keys: { [environment: string]: string | null } = {}

  private static apiHosts: { [environment: string]: string } = {
    [EnvironmentType.LOCAL]: `http://${this.LOCAL_API_ADDRESS}:3000`,
    [EnvironmentType.STAGING]: process.env.STAGING_API_HOST,
    [EnvironmentType.PRODUCTION]: process.env.PRODUCTION_API_HOST,
  }

  private static backupApiHosts: { [environment: string]: string } = {
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
    this.keys = {
      [EnvironmentType.LOCAL]: await this.loadFromVault(
        EnvironmentType.LOCAL,
        process.env.ENV_VAR_NAME
      ),
      [EnvironmentType.STAGING]: await this.loadFromVault(
        EnvironmentType.STAGING,
        process.env.ENV_VAR_NAME
      ),
      [EnvironmentType.PRODUCTION]: await this.loadFromVault(
        EnvironmentType.PRODUCTION,
        process.env.ENV_VAR_NAME
      ),
    }
  }

  public static getKey(environment: EnvironmentType): string | null {
    return this.keys[environment]
  }

  public static getApiHost(environment: EnvironmentType): string {
    return this.apiHosts[environment]
  }

  public static getBackupApiHost(environment: EnvironmentType): string {
    return this.backupApiHosts[environment]
  }
}
