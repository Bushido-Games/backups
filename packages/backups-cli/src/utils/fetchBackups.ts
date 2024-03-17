import * as ora from 'ora'
import { constants as HTTP_CONSTANTS } from 'node:http2'
import { Environment, TokenType } from './env'
import { EnvironmentType } from 'src/types'

export const fetchBackups = async (
  environment: EnvironmentType,
  tokenType: TokenType
): Promise<string[]> => {
  const fetchSpinner = ora()
  fetchSpinner.start('Fetching backups list from the cloud...')

  const res = await fetch(
    `${Environment.getBackupApiHost(environment)}/backup`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${Environment.getToken(environment, tokenType)}`,
      },
    }
  )

  if (res.status !== HTTP_CONSTANTS.HTTP_STATUS_OK) {
    throw new Error(JSON.stringify(await res.json()))
  }

  const keys: string[] = await res.json()

  fetchSpinner.succeed('Successfully fetched backups list from the cloud!')

  return keys
}
