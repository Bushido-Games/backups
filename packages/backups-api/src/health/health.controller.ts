import { Controller, Get } from '@nestjs/common'
import { HealthService } from './health.service'
import { ReplicaSetStatusResponse } from './health.types'

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  public async getHealth(): Promise<ReplicaSetStatusResponse> {
    return await this.healthService.getHealth()
  }
}
