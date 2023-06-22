export const getDocumentsCount = (log: string): number =>
  parseInt(log.split('(')[1].split(' ')[0])
