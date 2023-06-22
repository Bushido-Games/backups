import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'

@Injectable()
export class FusionAuthGuard implements CanActivate {
  private readonly BACKUP_API_AUTHORIZATION_KEY =
    this.configService.get<string>('BACKUP_API_AUTHORIZATION_KEY')

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
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
