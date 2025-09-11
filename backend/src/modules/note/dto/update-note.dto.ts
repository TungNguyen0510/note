import { IsObject, IsOptional, IsString } from 'class-validator';

/** Payload to update a note's content. */
export class UpdateNoteDto {
  /** New JSON content for the note. */
  @IsObject()
  @IsOptional()
  json?: Record<string, any>;

  /** Optional new title for the note. */
  @IsString()
  @IsOptional()
  title?: string;
}


