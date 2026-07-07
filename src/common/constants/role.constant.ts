export enum ERole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export const ROLES_REQUIRING_EMPLOYEE: ERole[] = [
  ERole.MANAGER,
  ERole.EMPLOYEE,
];
