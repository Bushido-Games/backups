import * as chalk from 'chalk'
import * as inquirer from 'inquirer'
import * as ora from 'ora'
import {
  COMMON_SELECT_ENVIRONMENT_ONLY_ACCESSIBLE,
  DELETE_DUMP_SELECT_BACKUP,
  Environment,
  fetchBackups,
  TokenType,
} from 'src/utils'
import { constants as HTTP_CONSTANTS } from 'node:http2'
import { EnvironmentType } from 'src/types'

export const deleteDump = async (
  useEnvironment?: EnvironmentType
): Promise<void> => {
  const sourceEnvironment =
    useEnvironment ??
    (
      await inquirer.prompt(
        COMMON_SELECT_ENVIRONMENT_ONLY_ACCESSIBLE(TokenType.DELETE_BACKUP)
      )
    ).selectedEnvironment

  const { selectedKey } = await inquirer.prompt(
    DELETE_DUMP_SELECT_BACKUP(
      await fetchBackups(sourceEnvironment, TokenType.DELETE_BACKUP)
    )
  )

  if (selectedKey.toLowerCase().includes('finish deleting the dumps')) {
    return
  }

  const requestSpinner = ora()
  requestSpinner.start(
    'Sending dump delete request and waiting for response...'
  )

  const res = await fetch(
    `${Environment.getBackupApiHost(sourceEnvironment)}/backup`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Environment.getToken(
          sourceEnvironment,
          TokenType.DELETE_BACKUP
        )}`,
      },
      body: JSON.stringify({ key: selectedKey }),
    }
  )

  if (res.status !== HTTP_CONSTANTS.HTTP_STATUS_OK) {
    throw new Error(JSON.stringify(await res.json()))
  }

  requestSpinner.succeed(
    `The selected dump (${chalk.greenBright(
      selectedKey
    )}) has been successfully deleted from the cloud!`
  )

  await deleteDump(sourceEnvironment)
}
