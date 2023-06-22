import { IsNotEmpty, IsString } from 'class-validator'

export class DeleteBackupDto {
  @IsString()
  @IsNotEmpty()
  key: string
}
