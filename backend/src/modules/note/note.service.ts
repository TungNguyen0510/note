import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  json: any;
  created_at: string;
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
        json JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;

    await this.database.query`
      ALTER TABLE notes
      ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''
    `;

    await this.database.query`
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)
    `;

    this.schemaInitialized = true;
  }

  async findById(id: string): Promise<NoteRow | null> {
    await this.ensureSchema();
    const rows = await this.database.query<NoteRow>`
      SELECT id, user_id, title, json, created_at
      FROM notes
      WHERE id = ${id}::uuid
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async findByUserId(userId: string): Promise<NoteRow[]> {
    await this.ensureSchema();
    const rows = await this.database.query<NoteRow>`
      SELECT id, user_id, title, json, created_at
      FROM notes
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
    `;
    return rows;
  }

  async createNote(userId: string, json: any, title?: string): Promise<NoteRow> {
    await this.ensureSchema();
    const rows = await this.database.query<NoteRow>`
      INSERT INTO notes (user_id, title, json)
      VALUES (${userId}::uuid, ${title ?? ''}, ${JSON.stringify(json)}::jsonb)
      RETURNING id, user_id, title, json, created_at
    `;
    return rows[0];
  }

  async updateNoteById(
    id: string,
    userId: string,
    json: any | undefined,
    title?: string,
  ): Promise<NoteRow | null> {
    await this.ensureSchema();
    const jsonStr = json === undefined ? null : JSON.stringify(json);
    const titleParam = title === undefined ? null : title;
    const rows = await this.database.query<NoteRow>`
      UPDATE notes
      SET json = COALESCE(${jsonStr}::jsonb, json),
          title = COALESCE(${titleParam}, title)
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
      RETURNING id, user_id, title, json, created_at
    `;
    return rows[0] ?? null;
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


