import * as ora from 'ora'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { EnvironmentType } from 'src/types'

export interface BucketCredentials {
  appKeyId: string
  appKey: string
  bucketName: string
}

export class Environment {
  private static readonly LOCAL_API_ADDRESS = existsSync('/.dockerenv')
    ? 'host.docker.internal'
    : 'localhost'

  public static readonly EXPERT_MODE = existsSync(
    `${homedir()}/.backups-cli-expert-mode`
  )

  private static keys: { [environment in EnvironmentType]: string | null }

  private static buckets: {
    [environment in EnvironmentType]: BucketCredentials | null
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
    if (process.env.HAS_COMMON_BUCKETS === 'true') {
      const localAppKeyId = await this.loadFromVault(
        EnvironmentType.LOCAL,
        process.env.APP_KEY_ID_ENV_VAR_NAME
      )
      const localAppKey = await this.loadFromVault(
        EnvironmentType.LOCAL,
        process.env.APP_KEY_ENV_VAR_NAME
      )
      const localBucketName = await this.loadFromVault(
        EnvironmentType.LOCAL,
        process.env.BACKUP_BUCKET_NAME_ENV_VAR_NAME
      )
      const stagingAppKeyId = await this.loadFromVault(
        EnvironmentType.STAGING,
        process.env.APP_KEY_ID_ENV_VAR_NAME
      )
      const stagingAppKey = await this.loadFromVault(
        EnvironmentType.STAGING,
        process.env.APP_KEY_ENV_VAR_NAME
      )
      const stagingBucketName = await this.loadFromVault(
        EnvironmentType.STAGING,
        process.env.BACKUP_BUCKET_NAME_ENV_VAR_NAME
      )
      const productionAppKeyId = await this.loadFromVault(
        EnvironmentType.PRODUCTION,
        process.env.APP_KEY_ID_ENV_VAR_NAME
      )
      const productionAppKey = await this.loadFromVault(
        EnvironmentType.PRODUCTION,
        process.env.APP_KEY_ENV_VAR_NAME
      )
      const productionBucketName = await this.loadFromVault(
        EnvironmentType.PRODUCTION,
        process.env.BACKUP_BUCKET_NAME_ENV_VAR_NAME
      )

      this.buckets = {
        [EnvironmentType.LOCAL]:
          localAppKeyId && localAppKey && localBucketName
            ? {
                appKeyId: localAppKeyId,
                appKey: localAppKey,
                bucketName: localBucketName,
              }
            : null,
        [EnvironmentType.STAGING]:
          stagingAppKeyId && stagingAppKey && stagingBucketName
            ? {
                appKeyId: stagingAppKeyId,
                appKey: stagingAppKey,
                bucketName: stagingBucketName,
              }
            : null,
        [EnvironmentType.PRODUCTION]:
          productionAppKeyId && productionAppKey && productionBucketName
            ? {
                appKeyId: productionAppKeyId,
                appKey: productionAppKey,
                bucketName: productionBucketName,
              }
            : null,
      }
    } else {
      this.keys = {
        [EnvironmentType.LOCAL]: await this.loadFromVault(
          EnvironmentType.LOCAL,
          process.env.AUTHORIZATION_KEY_ENV_VAR_NAME
        ),
        [EnvironmentType.STAGING]: await this.loadFromVault(
          EnvironmentType.STAGING,
          process.env.AUTHORIZATION_KEY_ENV_VAR_NAME
        ),
        [EnvironmentType.PRODUCTION]: await this.loadFromVault(
          EnvironmentType.PRODUCTION,
          process.env.AUTHORIZATION_KEY_ENV_VAR_NAME
        ),
      }
    }
  }

  public static getAuthorizationKey(
    environment: EnvironmentType
  ): string | null {
    if (process.env.HAS_COMMON_BUCKETS === 'true') {
      throw new Error(
        'Attempted to call Environment#getAuthorizationKey in separate buckets mode!'
      )
    }

    return this.keys[environment]
  }

  public static getBucketCredentials(
    environment: EnvironmentType
  ): BucketCredentials | null {
    if (process.env.HAS_COMMON_BUCKETS === 'false') {
      throw new Error(
        'Attempted to call Environment#getBucketCredentials in common buckets mode!'
      )
    }

    return this.buckets[environment]
  }

  public static getAllBucketCredentials(): BucketCredentials[] {
    if (process.env.HAS_COMMON_BUCKETS === 'false') {
      throw new Error(
        'Attempted to call Environment#getBucketCredentials in common buckets mode!'
      )
    }

    return Object.values(this.buckets) // @TODO: probaby filter null values?
  }

  public static hasAccessToEnvironment(environment: EnvironmentType): boolean {
    return !!(process.env.HAS_COMMON_BUCKETS === 'true'
      ? this.getAuthorizationKey(environment)
      : this.getBucketCredentials(environment))
  }

  public static getApiHost(environment: EnvironmentType): string {
    return this.apiHosts[environment]
  }

  public static getBackupApiHost(environment: EnvironmentType): string {
    return this.backupApiHosts[environment]
  }
}
