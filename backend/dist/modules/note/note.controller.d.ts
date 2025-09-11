import { NoteService } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
export declare class NoteController {
    private readonly notes;
    constructor(notes: NoteService);
    getById(id: string): Promise<import("./note.service").NoteRow | null>;
    getByUserId(userId: string, req: any): Promise<import("./note.service").NoteRow[]>;
    create(req: any, dto: CreateNoteDto): Promise<import("./note.service").NoteRow>;
    update(id: string, req: any, dto: UpdateNoteDto): Promise<import("./note.service").NoteRow | null>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
