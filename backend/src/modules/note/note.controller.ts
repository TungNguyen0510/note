import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NoteService } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

/**
 * NoteController exposes read-only endpoints for notes.
 * - GET /note/:id -> single note by id
 * - GET /note/user/:userId -> list notes by user
 */
@UseGuards(JwtAuthGuard)
@Controller('note')
export class NoteController {
  constructor(private readonly notes: NoteService) {}

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.notes.findById(id);
  }

  @Get('user/:userId')
  getByUserId(@Param('userId') userId: string, @Req() req: any) {
    const q = (req.query?.q as string | undefined)?.trim();
    return this.notes.findByUserId(userId).then((rows) => {
      if (!q) return rows;
      const lower = q.toLowerCase();
      return rows.filter((n) => (n.title ?? '').toLowerCase().includes(lower));
    });
  }

  /** Create a new note for the authenticated user. */
  @Post()
  create(@Req() req: any, @Body() dto: CreateNoteDto) {
    const userId = req.user.sub as string;
    return this.notes.createNote(userId, dto.json, dto.title);
  }

  /** Update an existing note (ownership enforced). */
  @Put(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateNoteDto) {
    const userId = req.user.sub as string;
    return this.notes.updateNoteById(id, userId, dto.json, dto.title);
  }

  /** Delete a note (ownership enforced). */
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub as string;
    const ok = await this.notes.deleteNoteById(id, userId);
    return { success: ok };
  }
}


