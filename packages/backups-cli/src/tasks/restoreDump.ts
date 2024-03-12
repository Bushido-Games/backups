import * as chalk from 'chalk'
import * as inquirer from 'inquirer'
import * as ora from 'ora'
import {
  Environment,
  fetchBackups,
  RESTORE_DUMP_EXPERT_QUESTIONS,
  RESTORE_DUMP_SELECT_BACKUP,
  COMMON_SELECT_ENVIRONMENT_ONLY_ACCESSIBLE,
  RESTORE_DUMP_SELECT_FILTER,
  waitForNextTrack,
} from 'src/utils'
import {
  EnvironmentType,
  RestoreResponse,
  RestoreProgress,
  TrackerResponse,
} from 'src/types'
import { createDump } from './../tasks'
import { constants as HTTP_CONSTANTS } from 'node:http2'
import { fusionAuthImport } from './fusionAuthImport'

export const restoreDump = async (
  useKey?: string,
  sourceEnvironment?: EnvironmentType
): Promise<void> => {
  const { selectedEnvironment } = await inquirer.prompt(
    COMMON_SELECT_ENVIRONMENT_ONLY_ACCESSIBLE(sourceEnvironment)
  )

  const sourceKey =
    useKey ??
    (
      await inquirer.prompt(
        RESTORE_DUMP_SELECT_BACKUP(
          await fetchBackups(selectedEnvironment),
          (
            await inquirer.prompt(RESTORE_DUMP_SELECT_FILTER())
          ).selectedFilter
        )
      )
    ).selectedKey

  let backupBeforeRestoration = true
  let dropCurrent = true
  let importUsers = true

  if (Environment.EXPERT_MODE) {
    const { _backupBeforeRestoration, _dropCurrent, _importUsers } =
      await inquirer.prompt(
        RESTORE_DUMP_EXPERT_QUESTIONS(
          backupBeforeRestoration,
          dropCurrent,
          importUsers
        )
      )

    backupBeforeRestoration = _backupBeforeRestoration
    dropCurrent = _dropCurrent
    importUsers = _importUsers
  }

  if (backupBeforeRestoration) {
    const forceDefaultKey = true
    await createDump(forceDefaultKey, selectedEnvironment)
  }

  const requestSpinner = ora()
  const downloadSpinner = ora()
  const restoreSpinner = ora()

  requestSpinner.start(
    'Sending dump restoration request and waiting for response...'
  )

  const res = await fetch(
    `${Environment.getBackupApiHost(selectedEnvironment)}/backup/restore`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Environment.getKey(selectedEnvironment)}`,
      },
      body: JSON.stringify({ key: sourceKey, dropCurrent }),
    }
  )

  if (res.status !== HTTP_CONSTANTS.HTTP_STATUS_CREATED) {
    throw new Error(JSON.stringify(await res.json()))
  }

  const { trackerId }: RestoreResponse = await res.json()

  let isFinished = false
  let isRestoring = false

  while (!isFinished) {
    await waitForNextTrack()

    const res = await fetch(
      `${Environment.getBackupApiHost(
        selectedEnvironment
      )}/backup/track/${encodeURIComponent(trackerId)}`,
      { method: 'GET' }
    )

    if (res.status !== HTTP_CONSTANTS.HTTP_STATUS_OK) {
      throw new Error(JSON.stringify(await res.json()))
    }

    const { progress, collections, documents }: TrackerResponse =
      await res.json()

    if (isRestoring) {
      restoreSpinner.text = `Restoring database dump... (${chalk.greenBright(
        collections
      )} collections and ${chalk.greenBright(documents)} documents restored)`
    }

    if (progress.includes(RestoreProgress.DOWNLOAD_STARTED)) {
      requestSpinner.succeed('Dump restoration has been started!')
      downloadSpinner.start('Downloading database dump from the cloud...')
    }

    if (progress.includes(RestoreProgress.DOWNLOAD_FINISHED)) {
      downloadSpinner.succeed(
        `Database dump has been successfully downloaded from the cloud!`
      )
    }

    if (progress.includes(RestoreProgress.RESTORE_STARTED)) {
      isRestoring = true
      restoreSpinner.start(
        `Restoring database dump... (${chalk.greenBright(
          collections
        )} collections and ${chalk.greenBright(documents)} documents restored)`
      )
    }

    if (progress.includes(RestoreProgress.RESTORE_FINISHED)) {
      isFinished = true
      isRestoring = false
      restoreSpinner.succeed(
        `Database dump ${chalk.greenBright(
          sourceKey
        )} has been successfully restored to ${chalk.greenBright(
          selectedEnvironment
        )}! (${chalk.greenBright(
          collections
        )} collections and ${chalk.greenBright(documents)} documents)`
      )
    }
  }

  if (process.env.HAS_FA_IMPORT === 'true' && importUsers) {
    await fusionAuthImport(selectedEnvironment)
  }
}
