import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@/common/constants/role.constant';
import { IUser } from '../types/user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const req = context.switchToHttp().getRequest();
    const user = req.user as IUser;
    const isAuthorized = requiredRoles.some((role) => user.roleId === role);

    if (!isAuthorized) {
      throw new ForbiddenException(
        'You are not authorized to access this resource',
      );
    }

    return true;
  }
}
