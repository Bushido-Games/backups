import { Injectable } from '@nestjs/common'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

@Injectable()
export class ShellService {
  private readonly TOOLS_DIR = '/opt/tools'
  private readonly MONGO_SHELL_PATH = `${this.TOOLS_DIR}/mongosh`
  private readonly MAX_BUFFER_64_MB = 8192 * 8192
  private readonly RESPONSE_TIMEOUT = 5000

  public async evaluate(
    connectionString: string,
    commands: string[]
  ): Promise<string> {
    const { stdout } = await promisify(execFile)(
      this.MONGO_SHELL_PATH,
      [
        connectionString,
        ...commands.map((command: string): string => `--eval="${command}"`),
        '--quiet',
      ],
      {
        maxBuffer: this.MAX_BUFFER_64_MB,
        timeout: this.RESPONSE_TIMEOUT,
      }
    )

    return stdout
  }
}
