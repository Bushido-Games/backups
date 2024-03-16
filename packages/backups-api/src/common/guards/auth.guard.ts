import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { EnvironmentType } from 'src/backup/backup.types'
import { ALLOWED_TOKEN_TYPES_KEY } from '../decorators/allowed-tokens.decorator'

export enum TokenType {
  GET_HEALTH = 'get-health',
  CREATE_BACKUP = 'create-backup',
  RESTORE_BACKUP = 'restore-backup',
  DELETE_BACKUP = 'delete-backup',
  IMPORT_USERS = 'import-users',
}

interface EnvironmentTokens {
  getHealth: string
  createBackup: string
  restoreBackup: string
  deleteBackup: string
  importUsers: string
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly BACKUP_API_AUTHORIZATION_TOKENS: {
    [environmentType in EnvironmentType]: EnvironmentTokens
  } = JSON.parse(
    this.configService.get<string>('BACKUP_API_AUTHORIZATION_TOKENS') ?? '{}'
  )

  private readonly ENVIRONMENT_NAME: EnvironmentType =
    this.configService.get<EnvironmentType>('ENVIRONMENT_NAME')

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
      let allowedToken: string

      switch (allowedTokenType) {
        case TokenType.GET_HEALTH:
          allowedToken =
            this.BACKUP_API_AUTHORIZATION_TOKENS[this.ENVIRONMENT_NAME]
              .getHealth
          break

        case TokenType.CREATE_BACKUP:
          allowedToken =
            this.BACKUP_API_AUTHORIZATION_TOKENS[this.ENVIRONMENT_NAME]
              .createBackup
          break

        case TokenType.RESTORE_BACKUP:
          allowedToken =
            this.BACKUP_API_AUTHORIZATION_TOKENS[this.ENVIRONMENT_NAME]
              .restoreBackup
          break

        case TokenType.DELETE_BACKUP:
          allowedToken =
            this.BACKUP_API_AUTHORIZATION_TOKENS[this.ENVIRONMENT_NAME]
              .deleteBackup
          break

        case TokenType.IMPORT_USERS:
          allowedToken =
            this.BACKUP_API_AUTHORIZATION_TOKENS[this.ENVIRONMENT_NAME]
              .importUsers
          break
      }

      validAuthorizationHeaders.push(['Bearer', allowedToken].join(' '))
    }

    return validAuthorizationHeaders.includes(
      request.headers.authorization ?? ''
    )
  }
}
