import * as chalk from 'chalk'
import * as inquirer from 'inquirer'
import * as ora from 'ora'
import {
  COMMON_SELECT_ENVIRONMENT_ONLY_ACCESSIBLE,
  Environment,
  getDumpKeyProposal,
  getUserSpecifiedDumpKey,
  TokenType,
  waitForNextTrack,
} from 'src/utils'
import {
  EnvironmentType,
  CreateResponse,
  CreateProgress,
  TrackerResponse,
} from 'src/types'
import { constants as HTTP_CONSTANTS } from 'node:http2'

export const createDump = async (
  forceDefaultKey?: boolean,
  useEnvironment?: EnvironmentType
): Promise<{
  key: string
  sourceEnvironment: EnvironmentType
}> => {
  const sourceEnvironment =
    useEnvironment ??
    (
      await inquirer.prompt(
        COMMON_SELECT_ENVIRONMENT_ONLY_ACCESSIBLE(TokenType.CREATE_BACKUP)
      )
    ).selectedEnvironment

  const key = forceDefaultKey
    ? getDumpKeyProposal(sourceEnvironment).key
    : await getUserSpecifiedDumpKey(sourceEnvironment)

  const requestSpinner = ora()
  const dumpSpinner = ora()
  const uploadSpinner = ora()

  requestSpinner.start(
    'Sending dump creation request and waiting for response...'
  )

  const res = await fetch(
    `${Environment.getBackupApiHost(sourceEnvironment)}/backup`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Environment.getToken(
          sourceEnvironment,
          TokenType.CREATE_BACKUP
        )}`,
      },
      body: JSON.stringify({ key }),
    }
  )

  if (res.status !== HTTP_CONSTANTS.HTTP_STATUS_CREATED) {
    throw new Error(JSON.stringify(await res.json()))
  }

  const { trackerId }: CreateResponse = await res.json()

  let isFinished = false
  let isDumping = false

  while (!isFinished) {
    await waitForNextTrack()

    const res = await fetch(
      `${Environment.getBackupApiHost(
        sourceEnvironment
      )}/backup/track/${encodeURIComponent(trackerId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${Environment.getToken(
            sourceEnvironment,
            TokenType.CREATE_BACKUP
          )}`,
        },
      }
    )

    if (res.status !== HTTP_CONSTANTS.HTTP_STATUS_OK) {
      throw new Error(JSON.stringify(await res.json()))
    }

    const { progress, collections, documents }: TrackerResponse =
      await res.json()

    if (isDumping) {
      dumpSpinner.text = `Creating database dump... (${chalk.greenBright(
        collections
      )} collections and ${chalk.greenBright(documents)} documents dumped)`
    }

    if (progress.includes(CreateProgress.DUMP_STARTED)) {
      isDumping = true
      requestSpinner.succeed('Dump creation has been started!')
      dumpSpinner.start(
        `Creating database dump... (${chalk.greenBright(
          collections
        )} collections and ${chalk.greenBright(documents)} documents dumped)`
      )
    }

    if (progress.includes(CreateProgress.DUMP_FINISHED)) {
      isDumping = false
      dumpSpinner.succeed('Database dump has been successfully created!')
    }

    if (progress.includes(CreateProgress.UPLOAD_STARTED)) {
      uploadSpinner.start('Uploading database dump to the cloud...')
    }

    if (progress.includes(CreateProgress.UPLOAD_FINISHED)) {
      isFinished = true
      uploadSpinner.succeed(
        `Database dump ${chalk.greenBright(key)} from ${chalk.greenBright(
          sourceEnvironment
        )} has been successfully uploaded to the cloud! (${chalk.greenBright(
          collections
        )} collections and ${chalk.greenBright(documents)} documents)`
      )
    }

    if (progress.includes(CreateProgress.FAILED)) {
      isFinished = true
      uploadSpinner.fail(
        'Database dump creation has failed! See backups-api logs for more information.'
      )
    }
  }

  return { key, sourceEnvironment }
}
