import { OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
export interface NoteRow {
    id: string;
    user_id: string;
    title: string;
    json: any;
    created_at: string;
}
export declare class NoteService implements OnModuleInit {
    private readonly database;
    constructor(database: DatabaseService);
    private schemaInitialized;
    onModuleInit(): Promise<void>;
    private ensureSchema;
    findById(id: string): Promise<NoteRow | null>;
    findByUserId(userId: string): Promise<NoteRow[]>;
    createNote(userId: string, json: any, title?: string): Promise<NoteRow>;
    updateNoteById(id: string, userId: string, json: any | undefined, title?: string): Promise<NoteRow | null>;
    deleteNoteById(id: string, userId: string): Promise<boolean>;
}
