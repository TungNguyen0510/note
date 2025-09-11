import { IsObject, IsOptional, IsString } from 'class-validator';

/** Payload to create a note. */
export class CreateNoteDto {
  /** Optional title for the note. */
  @IsString()
  @IsOptional()
  title?: string;

  /** Arbitrary JSON content. */
  @IsObject()
  json!: Record<string, any>;
}


