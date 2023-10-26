import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { spawn } from 'node:child_process'
import { StringService } from 'src/string/string.service'
import { S3Service } from 'src/s3/s3.service'
import { readdir, unlink } from 'node:fs/promises'
import {
  BackupType,
  CreateProgress,
  EnvironmentType,
  RestoreProgress,
  TrackerResponse,
} from './backup.types'
import {
  consistsOnlyOfAllowedChars,
  getDocumentsCount,
  isDoneDumpingLog,
  isFinishedRestoringLog,
} from './helpers'
import { ConfigService } from '@nestjs/config'
import { HealthService } from 'src/health/health.service'
import { INVALID_DUMP_KEY, NONE_OF_INSTANCES_HEALTHY } from './backup.error'
import { ShellService } from 'src/shell/shell.service'

@Injectable()
export class BackupService {
  private readonly TMP_DIR: string = '/app/tmp'
  private readonly MONGO_DIR: string = '/opt/mongo'
  private readonly MONGO_DUMP_PATH: string = `${this.MONGO_DIR}/mongodump`
  private readonly MONGO_RESTORE_PATH: string = `${this.MONGO_DIR}/mongorestore`

  private readonly ENVIRONMENT_NAME: string =
    this.configService.get<string>('ENVIRONMENT_NAME')

  private readonly DATABASE_NAME: string = this.configService.get<string>(
    'MONGO_DB_DATABASE_NAME'
  )

  private readonly HAS_SECOND_INSTANCE: string = this.configService.get<string>(
    'HAS_SECOND_INSTANCE'
  )

  public readonly trackers: { [trackerId: string]: TrackerResponse } = {}

  constructor(
    private readonly s3Service: S3Service,
    private readonly stringService: StringService,
    private readonly configService: ConfigService,
    private readonly healthService: HealthService,
    private readonly shellService: ShellService
  ) {}

  validateKey(key: string): void {
    if (!consistsOnlyOfAllowedChars(key)) {
      throw new BadRequestException(INVALID_DUMP_KEY)
    }

    if (!key.endsWith('.gz')) {
      throw new BadRequestException(INVALID_DUMP_KEY)
    }

    const requiredKeywords: string[] = [
      BackupType.REQUESTED,
      this.ENVIRONMENT_NAME,
    ]

    for (const keyword of requiredKeywords) {
      if (!key.includes(keyword)) {
        throw new BadRequestException(INVALID_DUMP_KEY)
      }
    }

    const forbiddenKeywords: string[] = [BackupType.SCHEDULED]

    for (const environmentType of Object.values(EnvironmentType)) {
      if (environmentType !== this.ENVIRONMENT_NAME) {
        forbiddenKeywords.push(environmentType)
      }
    }

    for (const keyword of forbiddenKeywords) {
      if (key.includes(keyword)) {
        throw new BadRequestException(INVALID_DUMP_KEY)
      }
    }
  }

  prepareTracker(trackerId: string): void {
    this.trackers[trackerId] = {
      progress: [],
      collections: 0,
      documents: 0,
    }
  }

  processTracker(trackerId: string): TrackerResponse {
    const tracker = this.trackers[trackerId]

    const clone = JSON.parse(JSON.stringify(tracker))

    if (
      tracker.progress.includes(CreateProgress.UPLOAD_FINISHED) ||
      tracker.progress.includes(RestoreProgress.RESTORE_FINISHED)
    ) {
      delete this.trackers[trackerId]
    } else {
      tracker.progress = []
    }

    return clone
  }

  async cleanupTeamporaryDirectory(): Promise<PromiseSettledResult<void>[]> {
    const files = await readdir(this.TMP_DIR)

    return Promise.allSettled(
      files.map(
        (file: string): Promise<void> => unlink(`${this.TMP_DIR}/${file}`)
      )
    )
  }

  async selectConnectionStringForDump(): Promise<string> {
    const firstConnectionString =
      this.HAS_SECOND_INSTANCE === 'false'
        ? this.stringService.getPrimaryConnectionString()
        : this.stringService.getSecondaryConnectionString()

    try {
      await this.healthService.getHealthFrom(firstConnectionString)
      return firstConnectionString
    } catch {
      if (this.HAS_SECOND_INSTANCE === 'false') {
        throw new ServiceUnavailableException(NONE_OF_INSTANCES_HEALTHY)
      }

      try {
        await this.healthService.getHealthFrom(
          this.stringService.getPrimaryConnectionString()
        )

        return this.stringService.getPrimaryConnectionString()
      } catch {
        throw new ServiceUnavailableException(NONE_OF_INSTANCES_HEALTHY)
      }
    }
  }

  async createDump(
    connectionString: string,
    key: string,
    trackerId?: string
  ): Promise<void> {
    if (trackerId) {
      this.trackers[trackerId].progress.push(CreateProgress.DUMP_STARTED)
    }

    const path = `${this.TMP_DIR}/${key}`

    const params = [
      `--uri="${connectionString}"`,
      `--archive=${path}`,
      '--gzip',
      '--oplog',
      '--numParallelCollections=1',
    ]

    const mongoDumpProcess = spawn(this.MONGO_DUMP_PATH, params)

    if (trackerId) {
      mongoDumpProcess.stderr.on('data', (data: Buffer): void => {
        const logs = data.toString().split('\n')

        for (const log of logs) {
          if (!isDoneDumpingLog(log)) {
            continue
          }

          const documents = getDocumentsCount(log)

          this.trackers[trackerId].collections++
          this.trackers[trackerId].documents += documents
        }
      })
    }

    mongoDumpProcess.on('close', async (): Promise<void> => {
      if (trackerId) {
        this.trackers[trackerId].progress.push(CreateProgress.DUMP_FINISHED)

        this.trackers[trackerId].progress.push(CreateProgress.UPLOAD_STARTED)
      }

      await this.s3Service.uploadBackup(key, path)

      if (trackerId) {
        this.trackers[trackerId].progress.push(CreateProgress.UPLOAD_FINISHED)
      }

      await unlink(path)
    })
  }

  async restoreDump(
    key: string,
    trackerId: string,
    dropCurrent: boolean
  ): Promise<void> {
    this.trackers[trackerId].progress.push(RestoreProgress.DOWNLOAD_STARTED)

    const path = `${this.TMP_DIR}/${key}`

    await this.s3Service.downloadBackup(key, path)

    this.trackers[trackerId].progress.push(RestoreProgress.DOWNLOAD_FINISHED)

    this.trackers[trackerId].progress.push(RestoreProgress.RESTORE_STARTED)

    if (dropCurrent) {
      await this.shellService.evaluate(
        this.stringService.getPrimaryConnectionString(),
        [`use ${this.DATABASE_NAME}`, 'JSON.stringify(db.dropDatabase());']
      )
    }

    const params = [
      `--uri="${this.stringService.getPrimaryConnectionString()}"`,
      `--archive=${path}`,
      '--gzip',
      '--numParallelCollections=1',
    ]

    params.push(
      key.toLowerCase().includes(this.ENVIRONMENT_NAME.toLowerCase())
        ? '--oplogReplay'
        : `--db="${this.DATABASE_NAME}"`
    )

    const mongoRestoreProcess = spawn(this.MONGO_RESTORE_PATH, params)

    mongoRestoreProcess.stderr.on('data', (data: Buffer): void => {
      const logs = data.toString().split('\n')

      for (const log of logs) {
        if (!isFinishedRestoringLog(log)) {
          continue
        }

        const documents = getDocumentsCount(log)

        this.trackers[trackerId].collections++
        this.trackers[trackerId].documents += documents
      }
    })

    mongoRestoreProcess.on('close', async (): Promise<void> => {
      this.trackers[trackerId].progress.push(RestoreProgress.RESTORE_FINISHED)

      await unlink(path)
    })
  }
}
