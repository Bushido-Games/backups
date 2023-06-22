export const consistsOnlyOfAllowedChars = (key: string): boolean =>
  /^([a-zA-Z0-9\.\-\_\:]+)$/.test(key)
