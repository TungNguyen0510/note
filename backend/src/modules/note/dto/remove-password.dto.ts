import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for removing password from a note
 * Requires the current password to be provided for verification
 */
export class RemovePasswordDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
