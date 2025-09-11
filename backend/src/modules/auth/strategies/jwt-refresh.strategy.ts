import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Validates refresh JWTs signed with JWT_REFRESH_SECRET.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    const secret =
      configService.get<string>('JWT_REFRESH_SECRET') ||
      configService.get<string>('JWT_SECRET') ||
      'dev_refresh_secret';
    super({
      jwtFromRequest: (req: Request) =>
        getTokenFromCookies(req, 'refreshToken'),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: { sub: string; email: string }) {
    const refreshToken = getTokenFromCookies(req, 'refreshToken');
    return { ...payload, refreshToken };
  }
}

function getTokenFromCookies(req: Request, name: string): string | null {
  const rawCookie = req.headers['cookie'];
  if (!rawCookie) return null;
  const parts = rawCookie.split(';');
  for (const part of parts) {
    const [k, v] = part.split('=').map((s) => s.trim());
    if (k === name) return decodeURIComponent(v || '');
  }
  return null;
}
