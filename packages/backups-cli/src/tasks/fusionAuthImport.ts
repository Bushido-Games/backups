import {
  Environment,
  COMMON_SELECT_ENVIRONMENT_ONLY_ACCESSIBLE,
} from 'src/utils'
import * as chalk from 'chalk'
import * as inquirer from 'inquirer'
import * as ora from 'ora'
import { constants as HTTP_CONSTANTS } from 'node:http2'
import { EnvironmentType } from 'src/types'

export const fusionAuthImport = async (
  useEnvironment?: EnvironmentType
): Promise<void> => {
  const selectedEnvironment =
    useEnvironment ??
    (await inquirer.prompt(COMMON_SELECT_ENVIRONMENT_ONLY_ACCESSIBLE()))
      .selectedEnvironment

  const importSpinner = ora()

  importSpinner.start('Importing users from FusionAuth...')

  const res = await fetch(
    `${Environment.getApiHost(selectedEnvironment)}/user/get-user-from-fa`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Environment.getKey(selectedEnvironment)}`,
      },
      body: JSON.stringify({}),
    }
  )

  if (res.status !== HTTP_CONSTANTS.HTTP_STATUS_CREATED) {
    throw new Error(JSON.stringify(await res.json()))
  }

  const data = await res.json()

  importSpinner.succeed(
    `Successfully imported ${chalk.greenBright(
      data.length
    )} users from FusionAuth!`
  )
}
