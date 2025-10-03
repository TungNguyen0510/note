import { OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
export interface NoteRow {
    id: string;
    user_id: string;
    title: string;
    password_hash?: string;
    created_at: string;
}
export interface NoteContentRow {
    note_id: string;
    json: any;
    updated_at: string;
}
export declare class NoteService implements OnModuleInit {
    private readonly database;
    constructor(database: DatabaseService);
    private schemaInitialized;
    onModuleInit(): Promise<void>;
    private ensureSchema;
    findById(id: string): Promise<NoteRow | null>;
    findByIdWithContent(id: string): Promise<(NoteRow & {
        json?: any;
    }) | null>;
    findByUserId(userId: string): Promise<NoteRow[]>;
    createNote(userId: string, json: any, title?: string, password?: string): Promise<NoteRow>;
    updateNoteById(id: string, userId: string, json: any | undefined, title?: string): Promise<NoteRow | null>;
    verifyPassword(noteId: string, password: string): Promise<boolean>;
    setPassword(noteId: string, userId: string, password: string): Promise<boolean>;
    removePassword(noteId: string, userId: string): Promise<boolean>;
    changePassword(noteId: string, userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
    deleteNoteById(id: string, userId: string): Promise<boolean>;
}
