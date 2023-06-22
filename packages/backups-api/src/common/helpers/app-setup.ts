import {
  DynamicModule,
  INestApplication,
  Type,
  ValidationPipe,
} from '@nestjs/common'
import { useContainer } from 'class-validator'

export const appSetup = (
  app: INestApplication,
  mainModule: DynamicModule | Type<unknown>
) => {
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  useContainer(app.select(mainModule), { fallbackOnErrors: true })
}
