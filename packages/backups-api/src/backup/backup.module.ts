import { Module } from '@nestjs/common'
import { BackupController } from './backup.controller'
import { BackupService } from './backup.service'
import { ConfigService } from '@nestjs/config'
import { JobService } from 'src/job/job.service'
import { S3Service } from 'src/s3/s3.service'
import { StringService } from 'src/string/string.service'
import { HealthService } from 'src/health/health.service'
import { ShellService } from 'src/shell/shell.service'
import { CliService } from 'src/cli/cli.service'

@Module({
  controllers: [BackupController],
  providers: [
    BackupService,
    ConfigService,
    HealthService,
    JobService,
    S3Service,
    StringService,
    ShellService,
    CliService,
  ],
})
export class BackupModule {}
