import { BackupType, EnvironmentType } from 'src/types'

export const getDumpKeyProposal = (
  environment: EnvironmentType
): { ext: string; key: string } => {
  const ext = 'gz'

  const key = [
    [environment, BackupType.REQUESTED, new Date().toISOString()].join('_'),
    ext,
  ].join('.')

  return { ext: `.${ext}`, key }
}
