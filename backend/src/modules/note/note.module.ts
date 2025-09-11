import { Module } from '@nestjs/common';
import { NoteService } from './note.service';
import { NoteController } from './note.controller';

/**
 * NoteModule bundles controller and service for notes feature.
 */
@Module({
  controllers: [NoteController],
  providers: [NoteService],
})
export class NoteModule {}


