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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const argon2 = __importStar(require("argon2"));
let UserService = class UserService {
    database;
    constructor(database) {
        this.database = database;
    }
    async onModuleInit() {
        await this.ensureSchema();
    }
    schemaInitialized = false;
    async ensureSchema() {
        if (this.schemaInitialized)
            return;
        await this.database.query `CREATE EXTENSION IF NOT EXISTS pgcrypto`;
        await this.database.query `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        refresh_token_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;
        const col = await this.database.query `
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'id'
    `;
        const currentType = col[0]?.data_type;
        if (currentType && currentType !== 'uuid') {
            await this.database.query `ALTER TABLE users ADD COLUMN IF NOT EXISTS id_new UUID`;
            const countNew = await this.database.query `
        SELECT COUNT(1) as count FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'id_new'
      `;
            await this.database.query `UPDATE users SET id_new = gen_random_uuid() WHERE id_new IS NULL`;
            await this.database.query `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey`;
            await this.database.query `ALTER TABLE users DROP COLUMN IF EXISTS id`;
            await this.database.query `ALTER TABLE users RENAME COLUMN id_new TO id`;
            await this.database.query `ALTER TABLE users ADD PRIMARY KEY (id)`;
        }
        const idMeta = await this.database.query `
      SELECT column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'id'
    `;
        const hasDefault = !!idMeta[0]?.column_default;
        const isNullable = idMeta[0]?.is_nullable === 'YES';
        if (!hasDefault) {
            await this.database.query `ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()`;
        }
        if (isNullable) {
            await this.database.query `UPDATE users SET id = gen_random_uuid() WHERE id IS NULL`;
            await this.database.query `ALTER TABLE users ALTER COLUMN id SET NOT NULL`;
        }
        const pk = await this.database.query `
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.users'::regclass AND contype = 'p'
    `;
        if (!pk[0]) {
            await this.database.query `ALTER TABLE users ADD PRIMARY KEY (id)`;
        }
        this.schemaInitialized = true;
    }
    async findById(id) {
        await this.ensureSchema();
        const rows = await this.database.query `
      SELECT id, email, password_hash, refresh_token_hash
      FROM users
      WHERE id = ${id}::uuid
      LIMIT 1
    `;
        return rows[0] ?? null;
    }
    async findByEmail(email) {
        await this.ensureSchema();
        const rows = await this.database.query `
      SELECT id, email, password_hash, refresh_token_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
        return rows[0] ?? null;
    }
    async createUser(email, password) {
        await this.ensureSchema();
        const passwordHash = await argon2.hash(password);
        const rows = await this.database.query `
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id, email
    `;
        return rows[0];
    }
    async updateRefreshToken(userId, refreshToken) {
        await this.ensureSchema();
        const refreshHash = refreshToken ? await argon2.hash(refreshToken) : null;
        await this.database.query `
      UPDATE users
      SET refresh_token_hash = ${refreshHash}
      WHERE id = ${userId}::uuid
    `;
    }
    async validateUserCredentials(email, password) {
        await this.ensureSchema();
        const user = await this.findByEmail(email);
        if (!user)
            return null;
        const passwordValid = await argon2.verify(user.password_hash, password);
        if (!passwordValid)
            return null;
        return { id: user.id, email: user.email };
    }
    async isRefreshTokenValid(userId, token) {
        await this.ensureSchema();
        const rows = await this.database.query `
      SELECT refresh_token_hash FROM users WHERE id = ${userId}::uuid
    `;
        const hash = rows[0]?.refresh_token_hash;
        if (!hash)
            return false;
        try {
            return await argon2.verify(hash, token);
        }
        catch {
            return false;
        }
    }
    async deleteUserById(userId) {
        await this.ensureSchema();
        await this.database.query `
      DELETE FROM users WHERE id = ${userId}::uuid
    `;
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], UserService);
//# sourceMappingURL=user.service.js.map