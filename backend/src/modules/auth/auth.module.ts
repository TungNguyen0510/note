import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UserModule } from '../user/user.module';
import { GoogleStrategy } from './strategies/google.strategy';

/**
 * AuthModule wires up JWT auth (access + refresh) and exposes endpoints.
 */
@Module({
  imports: [PassportModule, JwtModule.register({}), UserModule],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, GoogleStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
