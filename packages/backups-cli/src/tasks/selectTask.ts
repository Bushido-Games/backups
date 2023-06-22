import { TaskType } from 'src/types'
import * as inquirer from 'inquirer'
import {
  restoreDump,
  createDump,
  checkReplicaSetStatus,
  fusionAuthImport,
} from './../tasks'
import { Environment, SELECT_TASK } from 'src/utils'
import * as chalk from 'chalk'
import { deleteDump } from './deleteDump'

export const selectTask = async (): Promise<void> => {
  if (Environment.EXPERT_MODE) {
    console.log(
      `\n🤔 ${chalk.yellowBright(
        'Warning!'
      )} You have expert mode enabled. Don't use it if you're not sure what you're doing.\n`
    )
  }

  const { taskType } = await inquirer.prompt(SELECT_TASK)

  switch (taskType) {
    case TaskType.CREATE_DUMP:
      await createDump()
      break
    case TaskType.RESTORE_DUMP:
      await restoreDump()
      break
    case TaskType.COPY_DATABASE:
      const forceDefaultKey = true
      const { key, sourceEnvironment } = await createDump(forceDefaultKey)
      await restoreDump(key, sourceEnvironment)
      break
    case TaskType.DELETE_DUMPS:
      await deleteDump()
      break
    case TaskType.IMPORT_USERS:
      await fusionAuthImport()
      break
    case TaskType.REPLICA_SET_STATUS:
      await checkReplicaSetStatus()
      break
    case TaskType.EXIT:
      console.log('👋 See you!')
      return
    default:
      throw new Error(`Got unrecognized task type: ${taskType}`)
  }

  await selectTask()
}
