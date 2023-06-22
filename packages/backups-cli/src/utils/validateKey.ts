import * as chalk from 'chalk'
import { BackupType, EnvironmentType } from 'src/types'
import { consistsOnlyOfAllowedChars } from './consistsOnlyOfAllowedChars'

export const validateKey = (
  input: string,
  ext: string,
  sourceEnvironment: EnvironmentType,
  requirements: string
): string | boolean => {
  const key = input.split('\n')[0]

  if (!consistsOnlyOfAllowedChars(key)) {
    return requirements
  }

  if (!key.endsWith(ext)) {
    return `Dump name must end with ${chalk.greenBright(ext)} extension!`
  }

  const requiredKeywords: string[] = [BackupType.REQUESTED, sourceEnvironment]

  for (const keyword of requiredKeywords) {
    if (!key.includes(keyword)) {
      return `Dump name must include ${chalk.greenBright(keyword)} keyword!`
    }
  }

  const forbiddenKeywords: string[] = [BackupType.SCHEDULED]

  for (const environmentType of Object.values(EnvironmentType)) {
    if (environmentType !== sourceEnvironment) {
      forbiddenKeywords.push(environmentType)
    }
  }

  for (const keyword of forbiddenKeywords) {
    if (key.includes(keyword)) {
      return `Dump name can't include ${chalk.greenBright(keyword)} keyword!`
    }
  }

  return true
}
