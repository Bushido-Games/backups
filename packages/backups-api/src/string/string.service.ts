import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class StringService {
  private readonly USERNAME =
    this.configService.get<string>('MONGO_DB_USERNAME')

  private readonly PASSWORD =
    this.configService.get<string>('MONGO_DB_PASSWORD')

  private readonly HOST = this.configService.get<string>('MONGO_DB_HOST')

  private readonly PORT = this.configService.get<string>('MONGO_DB_PORT')

  private readonly BACKUP_HOST = this.configService.get<string>(
    'MONGO_DB_BACKUP_HOST'
  )

  private readonly BACKUP_PORT = this.configService.get<string>(
    'MONGO_DB_BACKUP_PORT'
  )

  private readonly MONGO_DB_AUTH_SOURCE = this.configService.get<string>(
    'MONGO_DB_AUTH_SOURCE'
  )

  public constructor(private readonly configService: ConfigService) {}

  private createConnectionString(
    readPreference: string,
    host: string,
    port: string
  ): string {
    const params = new URLSearchParams()
    params.append('authSource', this.MONGO_DB_AUTH_SOURCE)
    params.append('directConnection', 'true')
    params.append('readPreference', readPreference)
    params.append('w', '1')

    return `mongodb://${this.USERNAME}:${
      this.PASSWORD
    }@${host}:${port}/?${params.toString()}`
  }

  public getPrimaryConnectionString(): string {
    return this.createConnectionString('primary', this.HOST, this.PORT)
  }

  public getSecondaryConnectionString(): string {
    return this.createConnectionString(
      'secondary',
      this.BACKUP_HOST,
      this.BACKUP_PORT
    )
  }
}
