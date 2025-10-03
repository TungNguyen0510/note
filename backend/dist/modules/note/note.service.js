"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const argon2 = __importStar(require("argon2"));
let NoteService = class NoteService {
    database;
    constructor(database) {
        this.database = database;
    }
    schemaInitialized = false;
    async onModuleInit() {
        await this.ensureSchema();
    }
    async ensureSchema() {
        if (this.schemaInitialized)
            return;
        await this.database.query `CREATE EXTENSION IF NOT EXISTS pgcrypto`;
        await this.database.query `
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        password_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;
        await this.database.query `
      CREATE TABLE IF NOT EXISTS note_contents (
        note_id UUID PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
        json JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `;
        await this.database.query `
      ALTER TABLE notes
      ADD COLUMN IF NOT EXISTS password_hash TEXT
    `;
        await this.database.query `
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)
    `;
        await this.database.query `
      CREATE INDEX IF NOT EXISTS idx_note_contents_note_id ON note_contents(note_id)
    `;
        this.schemaInitialized = true;
    }
    async findById(id) {
        await this.ensureSchema();
        const rows = await this.database.query `
      SELECT id, user_id, title, password_hash, created_at
      FROM notes
      WHERE id = ${id}::uuid
      LIMIT 1
    `;
        return rows[0] ?? null;
    }
    async findByIdWithContent(id) {
        await this.ensureSchema();
        const rows = await this.database.query `
      SELECT n.id, n.user_id, n.title, n.password_hash, n.created_at, nc.json
      FROM notes n
      LEFT JOIN note_contents nc ON n.id = nc.note_id
      WHERE n.id = ${id}::uuid
      LIMIT 1
    `;
        const note = rows[0];
        if (!note)
            return null;
        if (!note.json) {
            await this.database.query `
        INSERT INTO note_contents (note_id, json)
        VALUES (${id}::uuid, ${JSON.stringify({ blocks: [] })}::jsonb)
        ON CONFLICT (note_id) DO NOTHING
      `;
            const updatedRows = await this.database.query `
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
    async findByUserId(userId) {
        await this.ensureSchema();
        const rows = await this.database.query `
      SELECT id, user_id, title, password_hash, created_at
      FROM notes
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
    `;
        return rows;
    }
    async createNote(userId, json, title, password) {
        await this.ensureSchema();
        const passwordHash = password ? await argon2.hash(password) : null;
        const noteRows = await this.database.query `
      INSERT INTO notes (user_id, title, password_hash)
      VALUES (${userId}::uuid, ${title ?? ''}, ${passwordHash})
      RETURNING id, user_id, title, password_hash, created_at
    `;
        const note = noteRows[0];
        await this.database.query `
      INSERT INTO note_contents (note_id, json)
      VALUES (${note.id}::uuid, ${JSON.stringify(json)}::jsonb)
    `;
        return note;
    }
    async updateNoteById(id, userId, json, title) {
        await this.ensureSchema();
        const titleParam = title === undefined ? null : title;
        const noteRows = await this.database.query `
      UPDATE notes
      SET title = COALESCE(${titleParam}, title)
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
      RETURNING id, user_id, title, password_hash, created_at
    `;
        if (!noteRows[0])
            return null;
        if (json !== undefined) {
            await this.database.query `
        INSERT INTO note_contents (note_id, json)
        VALUES (${id}::uuid, ${JSON.stringify(json)}::jsonb)
        ON CONFLICT (note_id) 
        DO UPDATE SET json = EXCLUDED.json, updated_at = now()
      `;
        }
        return noteRows[0];
    }
    async verifyPassword(noteId, password) {
        await this.ensureSchema();
        const rows = await this.database.query `
      SELECT password_hash
      FROM notes
      WHERE id = ${noteId}::uuid AND password_hash IS NOT NULL
      LIMIT 1
    `;
        if (!rows[0])
            return false;
        return await argon2.verify(rows[0].password_hash, password);
    }
    async setPassword(noteId, userId, password) {
        await this.ensureSchema();
        const passwordHash = await argon2.hash(password);
        const rows = await this.database.query `
      UPDATE notes
      SET password_hash = ${passwordHash}
      WHERE id = ${noteId}::uuid AND user_id = ${userId}::uuid
      RETURNING id
    `;
        return !!rows[0]?.id;
    }
    async removePassword(noteId, userId) {
        await this.ensureSchema();
        const rows = await this.database.query `
      UPDATE notes
      SET password_hash = NULL
      WHERE id = ${noteId}::uuid AND user_id = ${userId}::uuid
      RETURNING id
    `;
        return !!rows[0]?.id;
    }
    async changePassword(noteId, userId, oldPassword, newPassword) {
        await this.ensureSchema();
        const isValid = await this.verifyPassword(noteId, oldPassword);
        if (!isValid)
            return false;
        const newPasswordHash = await argon2.hash(newPassword);
        const rows = await this.database.query `
      UPDATE notes
      SET password_hash = ${newPasswordHash}
      WHERE id = ${noteId}::uuid AND user_id = ${userId}::uuid
      RETURNING id
    `;
        return !!rows[0]?.id;
    }
    async deleteNoteById(id, userId) {
        await this.ensureSchema();
        const rows = await this.database.query `
      DELETE FROM notes
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
      RETURNING id
    `;
        return !!rows[0]?.id;
    }
};
exports.NoteService = NoteService;
exports.NoteService = NoteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], NoteService);
//# sourceMappingURL=note.service.js.map