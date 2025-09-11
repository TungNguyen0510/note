import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Validates access JWTs signed with JWT_ACCESS_SECRET.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    const secret =
      configService.get<string>('JWT_ACCESS_SECRET') ||
      configService.get<string>('JWT_SECRET') ||
      'dev_access_secret';
    super({
      jwtFromRequest: (req: Request) => getTokenFromCookies(req, 'accessToken'),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: { sub: string; email: string }) {
    return payload;
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
