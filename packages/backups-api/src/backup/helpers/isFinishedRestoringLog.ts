export const isFinishedRestoringLog = (log: string): boolean =>
  log.includes('finished restoring') && log.includes('document')
