import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as argon2 from 'argon2';

/**
 * UserService encapsulates user persistence and credential operations.
 */
@Injectable()
export class UserService implements OnModuleInit {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Ensure the users table exists on startup for demo purposes.
   */
  async onModuleInit() {
    await this.ensureSchema();
  }

  private schemaInitialized = false;

  private async ensureSchema() {
    if (this.schemaInitialized) return;
    // Ensure UUID generation capability
    await this.database.query`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    // Create table with UUID id if not exists
    await this.database.query`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        refresh_token_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;

    // If table exists with non-UUID id, migrate to UUID
    const col = await this.database.query<{ data_type: string }>`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'id'
    `;
    const currentType = col[0]?.data_type;
    if (currentType && currentType !== 'uuid') {
      // Add new UUID column, backfill, switch PK
      await this.database.query`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_new UUID`;
      const countNew = await this.database.query<{ count: string }>`
        SELECT COUNT(1) as count FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'id_new'
      `;
      // Backfill only if id_new exists and any NULLs remain
      await this.database.query`UPDATE users SET id_new = gen_random_uuid() WHERE id_new IS NULL`;
      // Drop existing PK constraint (assumed default name users_pkey)
      await this.database.query`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey`;
      // Drop old id and rename
      await this.database.query`ALTER TABLE users DROP COLUMN IF EXISTS id`;
      await this.database.query`ALTER TABLE users RENAME COLUMN id_new TO id`;
      await this.database.query`ALTER TABLE users ADD PRIMARY KEY (id)`;
    }

    // Ensure id column has default, is non-null, and has a primary key when type already UUID
    const idMeta = await this.database.query<{
      column_default: string | null;
      is_nullable: 'YES' | 'NO';
    }>`
      SELECT column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'id'
    `;

    const hasDefault = !!idMeta[0]?.column_default;
    const isNullable = idMeta[0]?.is_nullable === 'YES';

    // Set default if missing
    if (!hasDefault) {
      await this.database.query`ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()`;
    }

    // Backfill NULL ids (if any), then enforce NOT NULL
    if (isNullable) {
      await this.database.query`UPDATE users SET id = gen_random_uuid() WHERE id IS NULL`;
      await this.database.query`ALTER TABLE users ALTER COLUMN id SET NOT NULL`;
    }

    // Ensure a primary key exists on id
    const pk = await this.database.query<{ conname: string }>`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.users'::regclass AND contype = 'p'
    `;
    if (!pk[0]) {
      await this.database.query`ALTER TABLE users ADD PRIMARY KEY (id)`;
    }
    this.schemaInitialized = true;
  }

  async findById(id: string) {
    await this.ensureSchema();
    const rows = await this.database.query<{
      id: string;
      email: string;
      password_hash: string;
      refresh_token_hash: string | null;
    }>`
      SELECT id, email, password_hash, refresh_token_hash
      FROM users
      WHERE id = ${id}::uuid
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async findByEmail(email: string) {
    await this.ensureSchema();
    const rows = await this.database.query<{
      id: string;
      email: string;
      password_hash: string;
      refresh_token_hash: string | null;
    }>`
      SELECT id, email, password_hash, refresh_token_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async createUser(email: string, password: string) {
    await this.ensureSchema();
    const passwordHash = await argon2.hash(password);
    const rows = await this.database.query<{ id: string; email: string }>`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id, email
    `;
    return rows[0];
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.ensureSchema();
    const refreshHash = refreshToken ? await argon2.hash(refreshToken) : null;
    await this.database.query`
      UPDATE users
      SET refresh_token_hash = ${refreshHash}
      WHERE id = ${userId}::uuid
    `;
  }

  async validateUserCredentials(email: string, password: string) {
    await this.ensureSchema();
    const user = await this.findByEmail(email);
    if (!user) return null;
    const passwordValid = await argon2.verify(user.password_hash, password);
    if (!passwordValid) return null;
    return { id: user.id, email: user.email };
  }

  async isRefreshTokenValid(userId: string, token: string) {
    await this.ensureSchema();
    const rows = await this.database.query<{
      refresh_token_hash: string | null;
    }>`
      SELECT refresh_token_hash FROM users WHERE id = ${userId}::uuid
    `;
    const hash = rows[0]?.refresh_token_hash;
    if (!hash) return false;
    try {
      return await argon2.verify(hash, token);
    } catch {
      return false;
    }
  }

  async deleteUserById(userId: string) {
    await this.ensureSchema();
    await this.database.query`
      DELETE FROM users WHERE id = ${userId}::uuid
    `;
  }
}
