import { OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
export declare class UserService implements OnModuleInit {
    private readonly database;
    constructor(database: DatabaseService);
    onModuleInit(): Promise<void>;
    private schemaInitialized;
    private ensureSchema;
    findById(id: string): Promise<{
        id: string;
        email: string;
        password_hash: string;
        refresh_token_hash: string | null;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        password_hash: string;
        refresh_token_hash: string | null;
    }>;
    createUser(email: string, password: string): Promise<{
        id: string;
        email: string;
    }>;
    updateRefreshToken(userId: string, refreshToken: string | null): Promise<void>;
    validateUserCredentials(email: string, password: string): Promise<{
        id: string;
        email: string;
    } | null>;
    isRefreshTokenValid(userId: string, token: string): Promise<boolean>;
    deleteUserById(userId: string): Promise<void>;
}
