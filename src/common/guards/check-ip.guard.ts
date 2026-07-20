import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
class CheckIpGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const ipWhitelist = this.configService.getOrThrow<string>('IP_WHITELIST');

    const request: Request = context.switchToHttp().getRequest();
    const rawIp = request.ip || request.socket.remoteAddress || '';
    const ip = rawIp.replace(/^::ffff:/, '');

    if (!ipWhitelist.includes(ip)) {
      throw new ForbiddenException('IP not allowed');
    }

    return true;
  }
}

export default CheckIpGuard;
