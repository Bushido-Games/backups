import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app/app.module'
import { appSetup } from './common/helpers/app-setup'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  appSetup(app, AppModule)

  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  await app.listen(3000)
}

bootstrap()
