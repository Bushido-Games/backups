import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { BackupModule } from 'src/backup/backup.module'
import { FusionAuthGuard } from 'src/common/guards/fusion-auth.guard'
import { ConfigModule } from 'src/config/config.module'
import { HealthModule } from 'src/health/health.module'

@Module({
  imports: [BackupModule, ConfigModule, HealthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: FusionAuthGuard,
    },
  ],
})
export class AppModule {}
