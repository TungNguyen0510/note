import { Controller, Delete, UseGuards, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly users: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMe(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.sub as string;
    await this.users.deleteUserById(userId);
    const isProd = process.env.NODE_ENV === 'production';
    const common = {
      httpOnly: true as const,
      sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax',
      secure: isProd || process.env.COOKIE_SECURE === 'true',
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
    };
    res.clearCookie('accessToken', common as any);
    res.clearCookie('refreshToken', common as any);
    return { success: true };
  }
}
