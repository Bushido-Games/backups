import { SetMetadata } from '@nestjs/common'
import { TokenType } from '../guards/auth.guard'

export const ALLOWED_TOKEN_TYPES_KEY = 'allowed-token-types'

export const AllowedTokens = (...allowedTokenTypes: TokenType[]) =>
  SetMetadata(ALLOWED_TOKEN_TYPES_KEY, allowedTokenTypes)
