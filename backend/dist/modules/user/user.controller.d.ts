import type { Response } from 'express';
import { UserService } from './user.service';
export declare class UserController {
    private readonly users;
    constructor(users: UserService);
    deleteMe(req: any, res: Response): Promise<{
        success: boolean;
    }>;
}
