import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    const userId = req.user.sub as string;
    return this.auth.me(userId);
  }

  @Post('signup')
  async signup(@Body() dto: SignUpDto, @Res({ passthrough: true }) res: any) {
    const tokens = await this.auth.signup(dto.email, dto.password);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { success: true };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    const tokens = await this.auth.login(dto.email, dto.password);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const userId = req.user.sub as string;
    res.clearCookie('accessToken', this.cookieClearOptions());
    res.clearCookie('refreshToken', this.cookieClearOptions());
    return this.auth.logout(userId);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const userId = req.user.sub as string;
    const refreshToken = req.user.refreshToken as string;
    const email = req.user.email as string;
    const tokens = await this.auth.refresh(userId, refreshToken, email);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { success: true };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    return { success: true };
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const profile = req.user as {
      email?: string;
      googleId: string;
      displayName?: string;
      picture?: string;
    };
    const tokens = await this.auth.loginWithGoogle(profile);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    const redirectUrl = process.env.OAUTH_SUCCESS_REDIRECT_URL || '/';
    if (redirectUrl) {
      res.redirect?.(redirectUrl);
      return;
    }
    return { success: true };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    const common = {
      httpOnly: true as const,
      sameSite:
        (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax',
      secure: isProd || process.env.COOKIE_SECURE === 'true',
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
    };
    res.cookie('accessToken', accessToken, {
      ...common,
      maxAge: this.parseMs(process.env.JWT_ACCESS_TTL) || 15 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      ...common,
      maxAge:
        this.parseMs(process.env.JWT_REFRESH_TTL) || 7 * 24 * 60 * 60 * 1000,
    });
  }

  private cookieClearOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      sameSite:
        (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax',
      secure: isProd || process.env.COOKIE_SECURE === 'true',
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
    } as const;
  }

  private parseMs(ttl?: string) {
    if (!ttl) return undefined;
    const match = /^([0-9]+)([smhd])?$/.exec(ttl);
    if (!match) return undefined;
    const n = parseInt(match[1], 10);
    const unit = match[2] || 's';
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    };
    return n * (multipliers[unit] || 1000);
  }
}
