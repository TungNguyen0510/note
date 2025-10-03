import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as argon2 from 'argon2';

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

/**
 * NoteService manages persistence for notes.
 * - Ensures `notes` table exists on startup
 * - Exposes read operations: findById, findByUserId
 */
@Injectable()
export class NoteService implements OnModuleInit {
  constructor(private readonly database: DatabaseService) {}

  private schemaInitialized = false;

  async onModuleInit() {
    await this.ensureSchema();
  }

  private async ensureSchema() {
    if (this.schemaInitialized) return;
    await this.database.query`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    await this.database.query`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        password_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    await this.database.query`
      CREATE TABLE IF NOT EXISTS note_contents (
        note_id UUID PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
        json JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `;

    await this.database.query`
      ALTER TABLE notes
      ADD COLUMN IF NOT EXISTS password_hash TEXT
    `;

    await this.database.query`
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)
    `;

    await this.database.query`
      CREATE INDEX IF NOT EXISTS idx_note_contents_note_id ON note_contents(note_id)
    `;

    this.schemaInitialized = true;
  }

  async findById(id: string): Promise<NoteRow | null> {
    await this.ensureSchema();
    const rows = await this.database.query<NoteRow>`
      SELECT id, user_id, title, password_hash, created_at
      FROM notes
      WHERE id = ${id}::uuid
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async findByIdWithContent(id: string): Promise<(NoteRow & { json?: any }) | null> {
    await this.ensureSchema();
    const rows = await this.database.query<(NoteRow & { json?: any })>`
      SELECT n.id, n.user_id, n.title, n.password_hash, n.created_at, nc.json
      FROM notes n
      LEFT JOIN note_contents nc ON n.id = nc.note_id
      WHERE n.id = ${id}::uuid
      LIMIT 1
    `;
    
    const note = rows[0];
    if (!note) return null;
    
    if (!note.json) {
      await this.database.query`
        INSERT INTO note_contents (note_id, json)
        VALUES (${id}::uuid, ${JSON.stringify({ blocks: [] })}::jsonb)
        ON CONFLICT (note_id) DO NOTHING
      `;
      
      const updatedRows = await this.database.query<(NoteRow & { json?: any })>`
        SELECT n.id, n.user_id, n.title, n.password_hash, n.created_at, nc.json
        FROM notes n
        LEFT JOIN note_contents nc ON n.id = nc.note_id
        WHERE n.id = ${id}::uuid
        LIMIT 1
      `;
      return updatedRows[0] ?? null;
    }
    
    return note;
  }

  async findByUserId(userId: string): Promise<NoteRow[]> {
    await this.ensureSchema();
    const rows = await this.database.query<NoteRow>`
      SELECT id, user_id, title, password_hash, created_at
      FROM notes
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
    `;
    return rows;
  }

  async createNote(userId: string, json: any, title?: string, password?: string): Promise<NoteRow> {
    await this.ensureSchema();
    
    const passwordHash = password ? await argon2.hash(password) : null;
    
    const noteRows = await this.database.query<NoteRow>`
      INSERT INTO notes (user_id, title, password_hash)
      VALUES (${userId}::uuid, ${title ?? ''}, ${passwordHash})
      RETURNING id, user_id, title, password_hash, created_at
    `;
    
    const note = noteRows[0];
    
    await this.database.query`
      INSERT INTO note_contents (note_id, json)
      VALUES (${note.id}::uuid, ${JSON.stringify(json)}::jsonb)
    `;
    
    return note;
  }

  async updateNoteById(
    id: string,
    userId: string,
    json: any | undefined,
    title?: string,
  ): Promise<NoteRow | null> {
    await this.ensureSchema();
    
    const titleParam = title === undefined ? null : title;
    const noteRows = await this.database.query<NoteRow>`
      UPDATE notes
      SET title = COALESCE(${titleParam}, title)
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
      RETURNING id, user_id, title, password_hash, created_at
    `;
    
    if (!noteRows[0]) return null;
    
    if (json !== undefined) {
      await this.database.query`
        INSERT INTO note_contents (note_id, json)
        VALUES (${id}::uuid, ${JSON.stringify(json)}::jsonb)
        ON CONFLICT (note_id) 
        DO UPDATE SET json = EXCLUDED.json, updated_at = now()
      `;
    }
    
    return noteRows[0];
  }

  async verifyPassword(noteId: string, password: string): Promise<boolean> {
    await this.ensureSchema();
    const rows = await this.database.query<{ password_hash: string }>`
      SELECT password_hash
      FROM notes
      WHERE id = ${noteId}::uuid AND password_hash IS NOT NULL
      LIMIT 1
    `;
    
    if (!rows[0]) return false;
    
    return await argon2.verify(rows[0].password_hash, password);
  }

  async setPassword(noteId: string, userId: string, password: string): Promise<boolean> {
    await this.ensureSchema();
    const passwordHash = await argon2.hash(password);
    const rows = await this.database.query<{ id: string }>`
      UPDATE notes
      SET password_hash = ${passwordHash}
      WHERE id = ${noteId}::uuid AND user_id = ${userId}::uuid
      RETURNING id
    `;
    return !!rows[0]?.id;
  }

  async removePassword(noteId: string, userId: string): Promise<boolean> {
    await this.ensureSchema();
    const rows = await this.database.query<{ id: string }>`
      UPDATE notes
      SET password_hash = NULL
      WHERE id = ${noteId}::uuid AND user_id = ${userId}::uuid
      RETURNING id
    `;
    return !!rows[0]?.id;
  }

  async changePassword(noteId: string, userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    await this.ensureSchema();
    
    const isValid = await this.verifyPassword(noteId, oldPassword);
    if (!isValid) return false;
    
    const newPasswordHash = await argon2.hash(newPassword);
    const rows = await this.database.query<{ id: string }>`
      UPDATE notes
      SET password_hash = ${newPasswordHash}
      WHERE id = ${noteId}::uuid AND user_id = ${userId}::uuid
      RETURNING id
    `;
    return !!rows[0]?.id;
  }

  async deleteNoteById(id: string, userId: string): Promise<boolean> {
    await this.ensureSchema();
    
    const rows = await this.database.query<{ id: string }>`
      DELETE FROM notes
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
      RETURNING id
    `;
    return !!rows[0]?.id;
  }
}



