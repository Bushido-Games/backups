import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

@Injectable()
export class CliService {
  private readonly TOOLS_DIR: string = '/opt/tools'
  private readonly B2_CLI_PATH: string = `${this.TOOLS_DIR}/b2-cli`
  private readonly MAX_BUFFER_64_MB = 8192 * 8192
  private readonly RESPONSE_TIMEOUT = 5000
  private readonly B2_BACKUP_APP_KEY_ID =
    this.configService.get<string>('AWS_ACCESS_KEY_ID')
  private readonly B2_BACKUP_APP_KEY = this.configService.get<string>(
    'AWS_SECRET_ACCESS_KEY'
  )

  public constructor(private readonly configService: ConfigService) {}

  public async execute(...params: string[]): Promise<string> {
    const { stdout } = await promisify(execFile)(this.B2_CLI_PATH, params, {
      maxBuffer: this.MAX_BUFFER_64_MB,
      timeout: this.RESPONSE_TIMEOUT,
      env: {
        B2_APPLICATION_KEY_ID: this.B2_BACKUP_APP_KEY_ID,
        B2_APPLICATION_KEY: this.B2_BACKUP_APP_KEY,
      },
    })

    return stdout
  }
}
