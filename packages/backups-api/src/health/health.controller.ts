import { Controller, Get } from '@nestjs/common'
import { AllowedTokens } from 'src/common/decorators/allowed-tokens.decorator'
import { TokenType } from 'src/common/guards/auth.guard'
import { HealthService } from './health.service'
import { ReplicaSetStatusResponse } from './health.types'

@Controller('health')
export class HealthController {
  public constructor(private readonly healthService: HealthService) {}

  @Get()
  @AllowedTokens(TokenType.GET_HEALTH)
  public async getHealth(): Promise<ReplicaSetStatusResponse> {
    return this.healthService.getHealth()
  }
}
