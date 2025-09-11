import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
export declare class AuthService {
    private readonly jwt;
    private readonly config;
    private readonly users;
    constructor(jwt: JwtService, config: ConfigService, users: UserService);
    private signTokens;
    me(id: string): Promise<{
        id: string;
        email: string;
        password_hash: string;
        refresh_token_hash: string | null;
    }>;
    signup(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<{
        success: boolean;
    }>;
    refresh(userId: string, refreshToken: string, email: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    loginWithGoogle(profile: {
        email?: string | null;
        googleId: string;
        displayName?: string | null;
        picture?: string | null;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
