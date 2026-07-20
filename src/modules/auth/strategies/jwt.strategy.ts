import { IPayloadToken } from '@/common/types/auths.type';
import { UsersService } from '@/modules/users/users.service';
import { Cache } from '@nestjs/cache-manager';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly cacheManager: Cache,
  ) {
    const jwtSecret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_ACCESS_SECRET is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: IPayloadToken) {
    const authorization = req.headers.authorization;
    const accessToken = authorization ? authorization.split(' ')[1] : '';

    const blacklistToken = await this.cacheManager.get<string>(
      `blacklist_token:${payload.userId}`,
    );

    if (blacklistToken && blacklistToken === accessToken) {
      throw new UnauthorizedException('Token is invalid');
    }

    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('User is not valid');
    }
    return user;
  }
}
