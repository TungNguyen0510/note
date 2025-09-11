import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UserService,
  ) {}

  private async signTokens(userId: string, email: string) {
    const accessPayload = { sub: userId, email };
    const refreshPayload = { sub: userId, email };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret:
        this.config.get<string>('JWT_ACCESS_SECRET') ||
        this.config.get<string>('JWT_SECRET') ||
        'dev_access_secret',
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL') ?? '15m',
    });
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret:
        this.config.get<string>('JWT_REFRESH_SECRET') ||
        this.config.get<string>('JWT_SECRET') ||
        'dev_refresh_secret',
      expiresIn: this.config.get<string>('JWT_REFRESH_TTL') ?? '7d',
    });
    return { accessToken, refreshToken };
  }

  async me(id: string) {
    const user = await this.users.findById(id);
    return user;
  }

  async signup(email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }
    const created = await this.users.createUser(email, password);
    const tokens = await this.signTokens(created.id, created.email);
    await this.users.updateRefreshToken(created.id, tokens.refreshToken);
    return tokens;
  }

  async login(email: string, password: string) {
    const user = await this.users.validateUserCredentials(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.signTokens(user.id, user.email);
    await this.users.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.users.updateRefreshToken(userId, null);
    return { success: true };
  }

  async refresh(userId: string, refreshToken: string, email: string) {
    const valid = await this.users.isRefreshTokenValid(userId, refreshToken);
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const tokens = await this.signTokens(userId, email);
    await this.users.updateRefreshToken(userId, tokens.refreshToken);
    return tokens;
  }

  async loginWithGoogle(profile: {
    email?: string | null;
    googleId: string;
    displayName?: string | null;
    picture?: string | null;
  }) {
    if (!profile.email) {
      throw new UnauthorizedException('Google account has no email');
    }
    let user = await this.users.findByEmail(profile.email);
    if (!user) {
      const placeholderPassword = `${profile.googleId}.${Date.now()}`;
      const created = await this.users.createUser(
        profile.email,
        placeholderPassword,
      );
      user = {
        id: created.id,
        email: created.email,
        password_hash: '',
        refresh_token_hash: null,
      } as any;
    }
    const tokens = await this.signTokens(user.id, profile.email);
    await this.users.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }
}
