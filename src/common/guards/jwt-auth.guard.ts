import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// this just tells passport to use our JwtStrategy when someone hits a protected route
// if the token is missing or invalid it automatically returns 401
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
