export enum ERole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum EUserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
}

export const ROLES_REQUIRING_EMPLOYEE: ERole[] = [
  ERole.MANAGER,
  ERole.EMPLOYEE,
];

export const ROLE_VALUES: ERole[] = [
  ERole.EMPLOYEE,
  ERole.MANAGER,
  ERole.ADMIN,
];
