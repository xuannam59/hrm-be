import { ForbiddenException } from '@nestjs/common';
import { IUser, IUserEmployee } from '@/common/types/user.type';

export function requireEmployee(user: IUser): IUserEmployee {
  if (!user.employee) {
    throw new ForbiddenException(
      'This action requires an employee profile linked to your account',
    );
  }
  return user.employee;
}

export function buildDisplayName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}
