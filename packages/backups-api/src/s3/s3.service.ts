import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3 as S3Client } from '@aws-sdk/client-s3'
import { createReadStream, createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { ReadableStream } from 'node:stream/web'

@Injectable()
export class S3Service {
  private readonly S3_REGION = this.configService.get<string>('S3_REGION')

  private readonly S3_ENDPOINT = this.configService.get<string>('S3_ENDPOINT')

  private readonly S3_CLIENT = new S3Client({
    region: this.S3_REGION,
    endpoint: this.S3_ENDPOINT,
  })

  private readonly BACKUP_BUCKET_NAME =
    this.configService.get<string>('BACKUP_BUCKET_NAME')

  private readonly COMMON_INPUT = { Bucket: this.BACKUP_BUCKET_NAME }

  constructor(private readonly configService: ConfigService) {}

  async uploadBackup(key: string, path: string): Promise<void> {
    const body = createReadStream(path)

    await this.S3_CLIENT.putObject({
      ...this.COMMON_INPUT,
      Key: key,
      Body: body,
    })
  }

  async backupExists(key: string): Promise<boolean> {
    try {
      await this.S3_CLIENT.headObject({
        ...this.COMMON_INPUT,
        Key: key,
      })

      return true
    } catch (err: any) {
      if (err.name === 'NotFound') {
        return false
      }

      throw err
    }
  }

  async deleteBackup(key: string): Promise<void> {
    await this.S3_CLIENT.deleteObject({ ...this.COMMON_INPUT, Key: key })
  }

  async listBackups(): Promise<string[]> {
    const { Contents } = await this.S3_CLIENT.listObjectsV2(this.COMMON_INPUT)

    return (Contents ?? []).map(({ Key }): string => Key)
  }

  async downloadBackup(key: string, path: string): Promise<void> {
    const { Body } = await this.S3_CLIENT.getObject({
      ...this.COMMON_INPUT,
      Key: key,
    })

    const readStream = Body.transformToWebStream()
    const writeStream = createWriteStream(path)

    Readable.fromWeb(readStream as ReadableStream).pipe(writeStream)

    return new Promise((resolve) => writeStream.on('close', resolve))
  }
}
