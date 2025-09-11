import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

/** Guard for refresh tokens */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
