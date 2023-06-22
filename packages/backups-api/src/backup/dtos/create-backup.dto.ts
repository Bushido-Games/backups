import { IsNotEmpty, IsString } from 'class-validator'

export class CreateBackupDto {
  @IsString()
  @IsNotEmpty()
  key: string
}
