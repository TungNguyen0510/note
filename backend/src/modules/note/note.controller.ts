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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NoteService } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RemovePasswordDto } from './dto/remove-password.dto';

@UseGuards(JwtAuthGuard)
@Controller('note')
export class NoteController {
  constructor(private readonly notes: NoteService) {}

  @Post(':id/content')
  async getContentById(@Param('id') id: string, @Body() dto: VerifyPasswordDto) {
    const note = await this.notes.findByIdWithContent(id);
    if (!note) {
      throw new HttpException('Note not found', HttpStatus.NOT_FOUND);
    }

    if (note.password_hash) {
      if (!dto.password) {
        throw new HttpException('Password required for this note', HttpStatus.UNAUTHORIZED);
      }
      const isValid = await this.notes.verifyPassword(id, dto.password);
      if (!isValid) {
        throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
      }
    }

    return {
      id: note.id,
      user_id: note.user_id,
      title: note.title,
      json: note.json,
      created_at: note.created_at,
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const note = await this.notes.findById(id);
    if (!note) {
      throw new HttpException('Note not found', HttpStatus.NOT_FOUND);
    }
    
    return {
      id: note.id,
      user_id: note.user_id,
      title: note.title,
      hasPassword: !!note.password_hash,
      created_at: note.created_at,
    };
  }

  @Get('user/:userId')
  async getByUserId(@Param('userId') userId: string, @Req() req: any) {
    const q = (req.query?.q as string | undefined)?.trim();
    const rows = await this.notes.findByUserId(userId);
    
    const notes = rows.map(note => ({
      id: note.id,
      user_id: note.user_id,
      title: note.title,
      hasPassword: !!note.password_hash,
      created_at: note.created_at,
    }));

    if (!q) return notes;
    const lower = q.toLowerCase();
    return notes.filter((n) => (n.title ?? '').toLowerCase().includes(lower));
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateNoteDto) {
    const userId = req.user.sub as string;
    const note = await this.notes.createNote(userId, dto.json, dto.title, dto.password);
    return {
      id: note.id,
      user_id: note.user_id,
      title: note.title,
      hasPassword: !!note.password_hash,
      created_at: note.created_at,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateNoteDto) {
    const userId = req.user.sub as string;
    const note = await this.notes.updateNoteById(id, userId, dto.json, dto.title);
    if (!note) {
      throw new HttpException('Note not found', HttpStatus.NOT_FOUND);
    }
    return {
      id: note.id,
      user_id: note.user_id,
      title: note.title,
      hasPassword: !!note.password_hash,
      created_at: note.created_at,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub as string;
    const ok = await this.notes.deleteNoteById(id, userId);
    return { success: ok };
  }

  @Post(':id/verify-password')
  async verifyPassword(@Param('id') id: string, @Body() dto: VerifyPasswordDto) {
    if (!dto.password) {
      throw new HttpException('Password is required', HttpStatus.BAD_REQUEST);
    }
    const isValid = await this.notes.verifyPassword(id, dto.password);
    if (!isValid) {
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    }
    return { success: true };
  }

  @Post(':id/set-password')
  async setPassword(@Param('id') id: string, @Req() req: any, @Body() dto: SetPasswordDto) {
    const userId = req.user.sub as string;
    const success = await this.notes.setPassword(id, userId, dto.password);
    if (!success) {
      throw new HttpException('Note not found', HttpStatus.NOT_FOUND);
    }
    return { success: true };
  }

  @Post(':id/change-password')
  async changePassword(@Param('id') id: string, @Req() req: any, @Body() dto: ChangePasswordDto) {
    const userId = req.user.sub as string;
    const success = await this.notes.changePassword(id, userId, dto.oldPassword, dto.newPassword);
    if (!success) {
      throw new HttpException('Invalid old password or note not found', HttpStatus.BAD_REQUEST);
    }
    return { success: true };
  }

  @Delete(':id/password')
  async removePassword(@Param('id') id: string, @Req() req: any, @Body() dto: RemovePasswordDto) {
    const userId = req.user.sub as string;
    
    const isValid = await this.notes.verifyPassword(id, dto.password);
    if (!isValid) {
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    }
    
    const success = await this.notes.removePassword(id, userId);
    if (!success) {
      throw new HttpException('Note not found', HttpStatus.NOT_FOUND);
    }
    return { success: true };
  }
}


