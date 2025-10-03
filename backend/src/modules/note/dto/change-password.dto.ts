import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'Old password cannot be empty' })
  oldPassword!: string;

  @IsString()
  @MinLength(1, { message: 'New password cannot be empty' })
  newPassword!: string;
}
