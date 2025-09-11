import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

/** Guard for access tokens */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
