import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly BACKUP_API_AUTHORIZATION_KEY =
    this.configService.get<string>('BACKUP_API_AUTHORIZATION_KEY')

  private readonly HAS_COMMON_BUCKETS =
    this.configService.get<string>('HAS_COMMON_BUCKETS')

  public constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    if (this.HAS_COMMON_BUCKETS === 'true') {
      return
    }

    const isPrivate = this.reflector.get<boolean>(
      'isPrivate',
      context.getHandler()
    )

    if (!isPrivate) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()

    return (
      request.headers.authorization ===
      `Bearer ${this.BACKUP_API_AUTHORIZATION_KEY}`
    )
  }
}
