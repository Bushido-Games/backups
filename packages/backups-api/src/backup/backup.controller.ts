import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common'
import { S3Service } from 'src/s3/s3.service'
import {
  BACKUP_NOT_FOUND,
  CANNOT_DELETE_SCHEDULED,
  REPLICA_SET_NOT_HEALTHY,
  TRACKER_NOT_FOUND,
} from './backup.error'
import { BackupService } from './backup.service'
import { nanoid } from 'nanoid'
import { RestoreBackupDto, DeleteBackupDto, CreateBackupDto } from './dtos'
import {
  BackupType,
  CreateResponse,
  RestoreResponse,
  TrackerResponse,
} from './backup.types'
import { Private } from 'src/common/decorators/private.decorator'
import { HealthService } from 'src/health/health.service'

@Controller('backup')
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly s3Service: S3Service,
    private readonly healthService: HealthService
  ) {}

  @Get()
  async list(): Promise<string[]> {
    return this.s3Service.listBackups()
  }

  @Post()
  async create(@Body() { key }: CreateBackupDto): Promise<CreateResponse> {
    this.backupService.validateKey(key)

    const connectionString =
      await this.backupService.selectConnectionStringForDump()

    const trackerId = nanoid()

    this.backupService.prepareTracker(trackerId)

    this.backupService.createDump(connectionString, key, trackerId)

    return { trackerId }
  }

  @Post('restore')
  @Private()
  async restore(
    @Body() { key, dropCurrent }: RestoreBackupDto
  ): Promise<RestoreResponse> {
    if (!(await this.healthService.allHealthy())) {
      throw new ServiceUnavailableException(REPLICA_SET_NOT_HEALTHY)
    }

    if (!(await this.s3Service.backupExists(key))) {
      throw new NotFoundException(BACKUP_NOT_FOUND)
    }

    const trackerId = nanoid()

    this.backupService.prepareTracker(trackerId)

    this.backupService.restoreDump(key, trackerId, dropCurrent)

    return { trackerId }
  }

  @Delete()
  async delete(@Body() { key }: DeleteBackupDto): Promise<void> {
    if (key.toLowerCase().includes(BackupType.SCHEDULED)) {
      throw new BadRequestException(CANNOT_DELETE_SCHEDULED)
    }

    if (!(await this.s3Service.backupExists(key))) {
      throw new NotFoundException(BACKUP_NOT_FOUND)
    }

    await this.s3Service.deleteBackup(key)
  }

  @Get('track/:id')
  track(@Param('id') trackerId: string): TrackerResponse {
    if (!this.backupService.trackers[trackerId]) {
      throw new NotFoundException(TRACKER_NOT_FOUND)
    }

    return this.backupService.processTracker(trackerId)
  }
}
