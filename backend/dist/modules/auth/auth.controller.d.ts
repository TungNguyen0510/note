import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    me(req: any): Promise<{
        id: string;
        email: string;
        password_hash: string;
        refresh_token_hash: string | null;
    }>;
    signup(dto: SignUpDto, res: any): Promise<{
        success: boolean;
    }>;
    login(dto: LoginDto, res: any): Promise<{
        success: boolean;
    }>;
    logout(req: any, res: any): Promise<{
        success: boolean;
    }>;
    refresh(req: any, res: any): Promise<{
        success: boolean;
    }>;
    googleAuth(): {
        success: boolean;
    };
    googleCallback(req: any, res: any): Promise<{
        success: boolean;
    } | undefined>;
    private setAuthCookies;
    private cookieClearOptions;
    private parseMs;
}
