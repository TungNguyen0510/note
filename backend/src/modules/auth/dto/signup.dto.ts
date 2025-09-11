import { IsEmail, IsString, MinLength } from 'class-validator';

/** Signup request body */
export class SignUpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
