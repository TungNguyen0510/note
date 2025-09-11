"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
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
        json JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;
        await this.database.query `
      ALTER TABLE notes
      ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''
    `;
        await this.database.query `
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)
    `;
        this.schemaInitialized = true;
    }
    async findById(id) {
        await this.ensureSchema();
        const rows = await this.database.query `
      SELECT id, user_id, title, json, created_at
      FROM notes
      WHERE id = ${id}::uuid
      LIMIT 1
    `;
        return rows[0] ?? null;
    }
    async findByUserId(userId) {
        await this.ensureSchema();
        const rows = await this.database.query `
      SELECT id, user_id, title, json, created_at
      FROM notes
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
    `;
        return rows;
    }
    async createNote(userId, json, title) {
        await this.ensureSchema();
        const rows = await this.database.query `
      INSERT INTO notes (user_id, title, json)
      VALUES (${userId}::uuid, ${title ?? ''}, ${JSON.stringify(json)}::jsonb)
      RETURNING id, user_id, title, json, created_at
    `;
        return rows[0];
    }
    async updateNoteById(id, userId, json, title) {
        await this.ensureSchema();
        const jsonStr = json === undefined ? null : JSON.stringify(json);
        const titleParam = title === undefined ? null : title;
        const rows = await this.database.query `
      UPDATE notes
      SET json = COALESCE(${jsonStr}::jsonb, json),
          title = COALESCE(${titleParam}, title)
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
      RETURNING id, user_id, title, json, created_at
    `;
        return rows[0] ?? null;
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