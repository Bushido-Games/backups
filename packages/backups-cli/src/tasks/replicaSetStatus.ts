import * as inquirer from 'inquirer'
import * as ora from 'ora'
import { COMMON_SELECT_ENVIRONMENT, Environment } from 'src/utils'
import { constants as HTTP_CONSTANTS } from 'node:http2'

export const checkReplicaSetStatus = async (): Promise<void> => {
  const { selectedEnvironment } = await inquirer.prompt(
    COMMON_SELECT_ENVIRONMENT
  )

  const requestSpinner = ora()

  requestSpinner.start('Sending health request and waiting for response...')

  const res = await fetch(
    `${Environment.getBackupApiHost(selectedEnvironment)}/health`,
    { method: 'GET' }
  )

  if (res.status !== HTTP_CONSTANTS.HTTP_STATUS_OK) {
    throw new Error(JSON.stringify(await res.json()))
  }

  requestSpinner.succeed('Got response to health request:')

  console.log(await res.json())
}
