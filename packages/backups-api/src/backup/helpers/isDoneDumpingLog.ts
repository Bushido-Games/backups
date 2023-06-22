export const isDoneDumpingLog = (log: string): boolean =>
  log.includes('done dumping') && log.includes('document')
