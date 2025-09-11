import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
declare const JwtRefreshStrategy_base: new (...args: any) => any;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private readonly configService;
    constructor(configService: ConfigService);
    validate(req: Request, payload: {
        sub: string;
        email: string;
    }): {
        refreshToken: string | null;
        sub: string;
        email: string;
    };
}
export {};
