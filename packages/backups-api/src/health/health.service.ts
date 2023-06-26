import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ShellService } from 'src/shell/shell.service'
import { StringService } from 'src/string/string.service'
import { ReplicaSetMember, ReplicaSetStatusResponse } from './health.types'

@Injectable()
export class HealthService {
  private readonly HAS_SECOND_INSTANCE: string = this.configService.get<string>(
    'HAS_SECOND_INSTANCE'
  )

  constructor(
    private readonly configService: ConfigService,
    private readonly stringService: StringService,
    private readonly shellService: ShellService
  ) {}

  public async getHealthFrom(
    connectionString: string
  ): Promise<ReplicaSetStatusResponse> {
    return JSON.parse(
      await this.shellService.evaluate(connectionString, [
        'JSON.stringify(rs.status());',
      ])
    )
  }

  public async getHealth(): Promise<ReplicaSetStatusResponse> {
    try {
      return this.getHealthFrom(this.stringService.getPrimaryConnectionString())
    } catch {
      if (this.HAS_SECOND_INSTANCE === 'false') {
        return { ok: 0 }
      }

      try {
        return this.getHealthFrom(
          this.stringService.getSecondaryConnectionString()
        )
      } catch {
        return { ok: 0 }
      }
    }
  }

  public async allHealthy(): Promise<boolean> {
    const health = await this.getHealth()

    return (
      health.ok &&
      health.members &&
      health.members.every(
        (member: ReplicaSetMember): boolean => !!member.health
      )
    )
  }
}
