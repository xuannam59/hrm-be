export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export const ROLES_REQUIRING_EMPLOYEE: Role[] = [Role.MANAGER, Role.EMPLOYEE];
