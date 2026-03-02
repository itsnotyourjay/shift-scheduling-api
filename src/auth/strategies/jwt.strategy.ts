import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // looks for the token in the Authorization: Bearer <token> header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // uses our JWT_SECRET from .env to verify the token wasn't tampered with
      // the '!' tells TypeScript we're sure JWT_SECRET exists in .env
      // if it's missing the app will just crash on startup which is fine
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string; role: string }) {
    // whatever we return here gets attached to req.user on every protected route
    // so later we can just do req.user.sub or req.user.role
    return { sub: payload.sub, role: payload.role };
  }
}
