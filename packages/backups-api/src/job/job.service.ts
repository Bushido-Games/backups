import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { scheduleJob } from 'node-schedule'
import { BackupService } from 'src/backup/backup.service'
import { BackupType } from 'src/backup/backup.types'
import { S3Service } from 'src/s3/s3.service'

@Injectable()
export class JobService implements OnModuleInit {
  private readonly NIGHT_BACKUP_RULE = '15 02 * * *'
  private readonly DAY_BACKUP_RULE = '15 13 * * *'

  private readonly BACKUP_RULES = [this.NIGHT_BACKUP_RULE, this.DAY_BACKUP_RULE]

  constructor(
    private readonly s3Service: S3Service,
    private readonly backupService: BackupService,
    private readonly configService: ConfigService
  ) {}

  private readonly ENVIRONMENT_NAME =
    this.configService.get<string>('ENVIRONMENT_NAME')

  async onModuleInit(): Promise<void> {
    await this.backupService.cleanupTeamporaryDirectory()

    for (const rule of this.BACKUP_RULES) {
      scheduleJob(rule, async (): Promise<void> => {
        await this.s3Service.cleanupOldBackups()

        const connectionString =
          await this.backupService.selectConnectionStringForDump()

        const ext = 'gz'

        const key = [
          [
            this.ENVIRONMENT_NAME,
            BackupType.SCHEDULED,
            new Date().toISOString(),
          ].join('_'),
          ext,
        ].join('.')

        await this.backupService.createDump(connectionString, key)
      })
    }
  }
}
