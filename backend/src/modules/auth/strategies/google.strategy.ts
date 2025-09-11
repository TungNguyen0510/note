import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

/**
 * GoogleStrategy handles OAuth2 login with Google. It delegates user creation
 * or lookup to AuthService via the validate callback return value.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL:
        config.get<string>('GOOGLE_CALLBACK_URL') || '/auth/google/callback',
      scope: ['profile', 'email'],
    });
  }

  /**
   * Called by Passport after Google authenticates the user. We pass through
   * minimal profile data which will be used downstream to create or find the user.
   */
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any) => void,
  ) {
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;
    const displayName = profile.displayName;
    const picture = profile.photos?.[0]?.value;
    const payload = { email, googleId, displayName, picture };
    done(null, payload);
  }
}
