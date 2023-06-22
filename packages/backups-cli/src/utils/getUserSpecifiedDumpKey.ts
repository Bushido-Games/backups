import * as inquirer from 'inquirer'
import { EnvironmentType } from 'src/types'
import { EDIT_DUMP_KEY } from './prompts'

export const getUserSpecifiedDumpKey = async (
  environment: EnvironmentType
): Promise<string> =>
  (await inquirer.prompt(EDIT_DUMP_KEY(environment))).selectedKey.split('\n')[0]
