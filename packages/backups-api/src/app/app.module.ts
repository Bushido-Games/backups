import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { BackupModule } from 'src/backup/backup.module'
import { AuthGuard } from 'src/common/guards/auth.guard'
import { ConfigModule } from 'src/config/config.module'
import { HealthModule } from 'src/health/health.module'

@Module({
  imports: [BackupModule, ConfigModule, HealthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
