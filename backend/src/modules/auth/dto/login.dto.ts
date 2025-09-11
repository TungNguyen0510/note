import { IsEmail, IsString, MinLength } from 'class-validator';

/** Login request body */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
