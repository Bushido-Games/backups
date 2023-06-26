import * as chalk from 'chalk'
import * as inquirer from 'inquirer'
import * as ora from 'ora'
import {
  COMMON_SELECT_ENVIRONMENT,
  COMMON_SELECT_ENVIRONMENT_ONLY_ACCESSIBLE,
  Environment,
  getDumpKeyProposal,
  getUserSpecifiedDumpKey,
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
        process.env.DUMP_AUTH_REQUIRED === 'true'
          ? COMMON_SELECT_ENVIRONMENT_ONLY_ACCESSIBLE()
          : COMMON_SELECT_ENVIRONMENT
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
      { method: 'GET' }
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
  }

  return { key, sourceEnvironment }
}
