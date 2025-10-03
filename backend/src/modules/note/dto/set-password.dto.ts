import { IsString, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsString()
  @MinLength(1, { message: 'Password cannot be empty' })
  password!: string;
}
