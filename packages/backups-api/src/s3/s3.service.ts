import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3 as S3Client } from '@aws-sdk/client-s3'
import { createReadStream, createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { ReadableStream } from 'node:stream/web'
import { CliService } from 'src/cli/cli.service'

interface B2Object {
  fileId: string
  size: number
  uploadTimestamp: number
}

@Injectable()
export class S3Service {
  private readonly MAX_MONTHS_TO_PERSIST: number = 1

  private readonly S3_REGION = this.configService.get<string>('S3_REGION')

  private readonly S3_ENDPOINT = this.configService.get<string>('S3_ENDPOINT')

  private readonly S3_CLIENT = new S3Client({
    region: this.S3_REGION,
    endpoint: this.S3_ENDPOINT,
  })

  private readonly BACKUP_BUCKET_NAME =
    this.configService.get<string>('BACKUP_BUCKET_NAME')

  private readonly COMMON_INPUT = { Bucket: this.BACKUP_BUCKET_NAME }

  public constructor(
    private readonly configService: ConfigService,
    private readonly cliService: CliService
  ) {}

  public async uploadBackup(key: string, path: string): Promise<void> {
    const body = createReadStream(path)

    await this.S3_CLIENT.putObject({
      ...this.COMMON_INPUT,
      Key: key,
      Body: body,
    })
  }

  public async backupExists(key: string): Promise<boolean> {
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

  public async deleteBackup(key: string): Promise<void> {
    await this.S3_CLIENT.deleteObject({ ...this.COMMON_INPUT, Key: key })
  }

  public async listBackups(): Promise<string[]> {
    const { Contents } = await this.S3_CLIENT.listObjectsV2(this.COMMON_INPUT)

    return (Contents ?? []).map(({ Key }): string => Key)
  }

  public async cleanupOldBackups(): Promise<void> {
    const removeBeforeDate = new Date()
    removeBeforeDate.setMonth(
      removeBeforeDate.getMonth() - this.MAX_MONTHS_TO_PERSIST
    )

    const contents: B2Object[] = JSON.parse(
      // More about b2-cli ls https://b2-command-line-tool.readthedocs.io/_/downloads/en/master/pdf/
      await this.cliService.execute(
        'ls',
        '--json',
        '--versions',
        `b2://${this.BACKUP_BUCKET_NAME}`
      )
    )

    const toDelete = contents.filter(
      ({ uploadTimestamp, size }: B2Object): boolean =>
        new Date(uploadTimestamp) < removeBeforeDate || size < 1
    )

    // Delete files in batches of 32 at a time
    while (toDelete.length) {
      await Promise.allSettled(
        toDelete.splice(0, 32).map(
          ({ fileId }: B2Object): Promise<string> =>
            // More about b2-cli rm https://b2-command-line-tool.readthedocs.io/_/downloads/en/master/pdf/
            this.cliService.execute('rm', `b2id://${fileId}`)
        )
      )
    }
  }

  public async downloadBackup(key: string, path: string): Promise<void> {
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
