import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { ALLOWED_TOKEN_TYPES_KEY } from '../decorators/allowed-tokens.decorator'

export enum TokenType {
  GET_HEALTH = 'get-health',
  CREATE_BACKUP = 'create-backup',
  RESTORE_BACKUP = 'restore-backup',
  DELETE_BACKUP = 'delete-backup',
  IMPORT_USERS = 'import-users',
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly BACKUPS_GET_HEALTH_TOKEN: string =
    this.configService.get<string>('BACKUPS_GET_HEALTH_TOKEN')
  private readonly BACKUPS_CREATE_BACKUP_TOKEN: string =
    this.configService.get<string>('BACKUPS_CREATE_BACKUP_TOKEN')
  private readonly BACKUPS_RESTORE_BACKUP_TOKEN: string =
    this.configService.get<string>('BACKUPS_RESTORE_BACKUP_TOKEN')
  private readonly BACKUPS_DELETE_BACKUP_TOKEN: string =
    this.configService.get<string>('BACKUPS_DELETE_BACKUP_TOKEN')

  public constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    const allowedTokenTypes = this.reflector.get<TokenType[]>(
      ALLOWED_TOKEN_TYPES_KEY,
      context.getHandler()
    )

    if (!allowedTokenTypes) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()

    const validAuthorizationHeaders: string[] = []

    for (const allowedTokenType of allowedTokenTypes) {
      switch (allowedTokenType) {
        case TokenType.GET_HEALTH:
          validAuthorizationHeaders.push(
            ['Bearer', this.BACKUPS_GET_HEALTH_TOKEN].join(' ')
          )
          continue

        case TokenType.CREATE_BACKUP:
          validAuthorizationHeaders.push(
            ['Bearer', this.BACKUPS_CREATE_BACKUP_TOKEN].join(' ')
          )
          continue

        case TokenType.RESTORE_BACKUP:
          validAuthorizationHeaders.push(
            ['Bearer', this.BACKUPS_RESTORE_BACKUP_TOKEN].join(' ')
          )
          continue

        case TokenType.DELETE_BACKUP:
          validAuthorizationHeaders.push(
            ['Bearer', this.BACKUPS_DELETE_BACKUP_TOKEN].join(' ')
          )
          continue
      }
    }

    return validAuthorizationHeaders.includes(
      request.headers.authorization ?? ''
    )
  }
}
