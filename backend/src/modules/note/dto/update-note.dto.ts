import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateNoteDto {
  @IsObject()
  @IsOptional()
  json?: Record<string, any>;

  @IsString()
  @IsOptional()
  title?: string;
}


