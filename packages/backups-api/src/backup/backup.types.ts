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

export enum BackupType {
  REQUESTED = 'requested',
  SCHEDULED = 'scheduled',
}
