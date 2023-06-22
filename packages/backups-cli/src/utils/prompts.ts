import { QuestionCollection } from 'inquirer'
import { BackupType, EnvironmentType, FilterType, TaskType } from 'src/types'
import { Environment } from './env'
import { getDumpKeyProposal } from './getDumpKeyProposal'
import { validateKey } from './validateKey'

export const SELECT_TASK = [
  {
    name: 'taskType',
    type: 'list',
    message: 'What do you want to do?',
    choices: [
      {
        value: TaskType.CREATE_DUMP,
        name: '💾 Create dump of current database from the selected environment',
      },
      {
        value: TaskType.RESTORE_DUMP,
        name: '⏪ Restore specific dump to the selected environment',
      },
      {
        value: TaskType.COPY_DATABASE,
        name: '🚚 Copy database from one environment to another',
      },
      {
        value: TaskType.DELETE_DUMPS,
        name: '🚮 Delete selected dumps from the cloud',
      },
      {
        value: TaskType.IMPORT_USERS,
        name: '👨 Import users from FusionAuth',
      },
      {
        value: TaskType.REPLICA_SET_STATUS,
        name: '🩺 Check health of the replica set',
      },
      {
        value: TaskType.EXIT,
        name: '🚪 Exit HMS CLI',
      },
    ],
  },
]

export const COMMON_SELECT_ENVIRONMENT = [
  {
    name: 'selectedEnvironment',
    type: 'list',
    message: 'Which environment do you want to use?',
    choices: [
      {
        value: EnvironmentType.LOCAL,
        name: '🏡 Local',
      },
      {
        value: EnvironmentType.STAGING,
        name: '🧪 Staging',
      },
      {
        value: EnvironmentType.PRODUCTION,
        name: '💰 Production',
      },
    ],
  },
]

export const EDIT_DUMP_KEY = (
  environment: EnvironmentType
): QuestionCollection => {
  const { ext, key } = getDumpKeyProposal(environment)

  const instruction =
    'Enter the name of the currently created dump, the appropriate proposal will already be filled in, you can change it or leave it unchanged.'

  const requirements =
    'Dump name must only consist of alphanumeric characters, periods, dashes, underscores, and colons!'

  const tips = [
    instruction,
    requirements,
    'Press CTRL+O to save changes if you have made any.',
    'Close the editor and confirm the name by pressing CTRL+X.',
    `Originally proposed name: ${key}`,
  ]

  const content = [
    key,
    tips.map((tip: string): string => `# ${tip}`).join('\n'),
  ].join('\n\n')

  return [
    {
      type: 'editor',
      name: 'selectedKey',
      postfix: '.sh',
      default: content,
      message: instruction,
      validate: (input: string): string | boolean =>
        validateKey(input, ext, environment, requirements),
    },
  ]
}

export const COMMON_SELECT_ENVIRONMENT_ONLY_ACCESSIBLE = (
  environment?: EnvironmentType
): QuestionCollection => [
  {
    name: 'targetEnvironment',
    type: 'list',
    message: 'Which environment do you want to use?',
    choices: [
      ...(Environment.getKey(EnvironmentType.LOCAL) &&
      environment !== EnvironmentType.LOCAL
        ? [
            {
              value: EnvironmentType.LOCAL,
              name: '🏡 Local',
            },
          ]
        : []),
      ...(Environment.getKey(EnvironmentType.STAGING) &&
      environment !== EnvironmentType.STAGING
        ? [
            {
              value: EnvironmentType.STAGING,
              name: '🧪 Staging',
            },
          ]
        : []),
      ...(Environment.getKey(EnvironmentType.PRODUCTION) &&
      environment !== EnvironmentType.PRODUCTION
        ? [
            {
              value: EnvironmentType.PRODUCTION,
              name: '💰 Production',
            },
          ]
        : []),
    ],
  },
]

export const RESTORE_DUMP_SELECT_FILTER = (): QuestionCollection => {
  const separator = '\u2022'

  return [
    {
      name: 'selectedFilter',
      type: 'list',
      message: 'Which dumps do you want to choose from?',
      choices: [
        {
          name: `🏡 Local ${separator} Requested ✋`,
          value: FilterType.LOCAL_REQUESTED,
        },
        {
          name: `🏡 Local ${separator} Scheduled ⌚`,
          value: FilterType.LOCAL_SCHEDULED,
        },
        {
          name: `🧪 Staging ${separator} Requested ✋`,
          value: FilterType.STAGING_REQUESTED,
        },
        {
          name: `🧪 Staging ${separator} Scheduled ⌚`,
          value: FilterType.STAGING_SCHEDULED,
        },
        {
          name: `💰 Production ${separator} Requested ✋`,
          value: FilterType.PRODUCTION_REQUESTED,
        },
        {
          name: `💰 Production ${separator} Scheduled ⌚`,
          value: FilterType.PRODUCTION_SCHEDULED,
        },
        {
          name: '🔎 Everything 📜',
          value: FilterType.EVERYTHING,
        },
      ],
    },
  ]
}

export const RESTORE_DUMP_SELECT_BACKUP = (
  keys: string[],
  filter: FilterType
): QuestionCollection => [
  {
    name: 'selectedKey',
    type: 'autocomplete',
    message: 'Which backup do you want to restore?',
    source: (_answersSoFar?: string, input?: string): string[] => {
      const requirements =
        filter === FilterType.EVERYTHING ? ['', ''] : filter.split('-')

      return keys.filter(
        (key: string): boolean =>
          key.toLowerCase().includes(requirements[0].toLowerCase()) &&
          key.toLowerCase().includes(requirements[1].toLowerCase()) &&
          key.toLowerCase().includes((input ?? '').toLowerCase())
      )
    },
  },
]

export const DELETE_DUMP_SELECT_BACKUP = (
  keys: string[]
): QuestionCollection => [
  {
    name: 'selectedKey',
    type: 'autocomplete',
    message: 'Which backup do you want to delete?',
    source: (_answersSoFar?: string, input?: string): string[] => [
      '✅ Finish deleting the dumps',
      ...keys.filter(
        (key: string): boolean =>
          !key.toLowerCase().includes(BackupType.SCHEDULED) &&
          key.toLowerCase().includes((input ?? '').toLowerCase())
      ),
    ],
  },
]

export const RESTORE_DUMP_EXPERT_QUESTIONS = (
  backupBeforeRestoration: boolean,
  dropCurrent: boolean,
  importUsers: boolean
): QuestionCollection => [
  {
    name: '_backupBeforeRestoration',
    type: 'confirm',
    message:
      'Do you want to create backup of current database before restoring? (recommended)',
    default: backupBeforeRestoration,
  },
  {
    name: '_dropCurrent',
    type: 'confirm',
    message:
      'Do you want to drop current database before restoring? (recommended)',
    default: dropCurrent,
  },
  {
    name: '_importUsers',
    type: 'confirm',
    message:
      'Do you want to import users from FusionAuth after restoration? (recommended)',
    default: importUsers,
  },
]
