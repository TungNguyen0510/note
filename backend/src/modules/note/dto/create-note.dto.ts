import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsObject()
  json!: Record<string, any>;

  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Password cannot be empty' })
  password?: string;
}


