export enum Role {
  ADMIN = 'ADMIN',
  HR = 'HR',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export const ROLES_REQUIRING_EMPLOYEE: Role[] = [
  Role.HR,
  Role.MANAGER,
  Role.EMPLOYEE,
];
