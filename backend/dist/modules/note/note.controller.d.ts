import { NoteService } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RemovePasswordDto } from './dto/remove-password.dto';
export declare class NoteController {
    private readonly notes;
    constructor(notes: NoteService);
    getContentById(id: string, dto: VerifyPasswordDto): Promise<{
        id: string;
        user_id: string;
        title: string;
        json: any;
        created_at: string;
    }>;
    getById(id: string): Promise<{
        id: string;
        user_id: string;
        title: string;
        hasPassword: boolean;
        created_at: string;
    }>;
    getByUserId(userId: string, req: any): Promise<{
        id: string;
        user_id: string;
        title: string;
        hasPassword: boolean;
        created_at: string;
    }[]>;
    create(req: any, dto: CreateNoteDto): Promise<{
        id: string;
        user_id: string;
        title: string;
        hasPassword: boolean;
        created_at: string;
    }>;
    update(id: string, req: any, dto: UpdateNoteDto): Promise<{
        id: string;
        user_id: string;
        title: string;
        hasPassword: boolean;
        created_at: string;
    }>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
    verifyPassword(id: string, dto: VerifyPasswordDto): Promise<{
        success: boolean;
    }>;
    setPassword(id: string, req: any, dto: SetPasswordDto): Promise<{
        success: boolean;
    }>;
    changePassword(id: string, req: any, dto: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
    removePassword(id: string, req: any, dto: RemovePasswordDto): Promise<{
        success: boolean;
    }>;
}
