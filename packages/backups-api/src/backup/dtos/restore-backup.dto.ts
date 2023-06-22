import { IsBoolean, IsNotEmpty, IsString } from 'class-validator'

export class RestoreBackupDto {
  @IsString()
  @IsNotEmpty()
  key: string

  @IsBoolean()
  dropCurrent: boolean
}
