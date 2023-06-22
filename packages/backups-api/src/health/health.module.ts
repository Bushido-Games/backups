import { Module } from '@nestjs/common'
import { ShellService } from 'src/shell/shell.service'
import { StringService } from 'src/string/string.service'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'

@Module({
  controllers: [HealthController],
  providers: [HealthService, StringService, ShellService],
})
export class HealthModule {}
