import { setTimeout } from 'node:timers/promises'

export const waitForNextTrack = (): Promise<void> => setTimeout(3000)
