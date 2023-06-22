import { Injectable } from '@nestjs/common'
import { ShellService } from 'src/shell/shell.service'
import { StringService } from 'src/string/string.service'
import { ReplicaSetMember, ReplicaSetStatusResponse } from './health.types'

@Injectable()
export class HealthService {
  constructor(
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
      return await this.getHealthFrom(
        this.stringService.getPrimaryConnectionString()
      )
    } catch {
      try {
        return await this.getHealthFrom(
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
