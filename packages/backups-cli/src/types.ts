export interface CreateResponse {
  trackerId: string
}

export interface RestoreResponse {
  trackerId: string
}

export interface TrackerResponse {
  progress: (CreateProgress | RestoreProgress)[]
  collections: number
  documents: number
}

export enum CreateProgress {
  DUMP_STARTED = 'dump-started',
  DUMP_FINISHED = 'dump-finished',
  UPLOAD_STARTED = 'upload-started',
  UPLOAD_FINISHED = 'upload-finished',
}

export enum RestoreProgress {
  DOWNLOAD_STARTED = 'download-started',
  DOWNLOAD_FINISHED = 'download-finished',
  RESTORE_STARTED = 'restore-started',
  RESTORE_FINISHED = 'restore-finished',
}

export enum EnvironmentType {
  LOCAL = 'local',
  STAGING = 'staging',
  PRODUCTION = 'prod',
}

export enum TaskType {
  CREATE_DUMP = 'create-dump',
  RESTORE_DUMP = 'restore-dump',
  COPY_DATABASE = 'copy-database',
  DELETE_DUMPS = 'delete-dumps',
  IMPORT_USERS = 'import-users',
  REPLICA_SET_STATUS = 'replica-set-status',
  EXIT = 'exit',
}

export enum BackupType {
  REQUESTED = 'requested',
  SCHEDULED = 'scheduled',
}

export enum FilterType {
  LOCAL_REQUESTED = 'local-requested',
  LOCAL_SCHEDULED = 'local-scheduled',
  STAGING_REQUESTED = 'staging-requested',
  STAGING_SCHEDULED = 'staging-scheduled',
  PRODUCTION_REQUESTED = 'prod-requested',
  PRODUCTION_SCHEDULED = 'prod-scheduled',
  EVERYTHING = 'everything',
}
