export const ROLE_ID = {
  ADMIN: 1,
  HR: 2,
  MANAGER: 3,
  EMPLOYEE: 4,
};

export enum Role {
  ADMIN = 1,
  HR = 2,
  MANAGER = 3,
  EMPLOYEE = 4,
}

export const ROLES_REQUIRING_EMPLOYEE: Role[] = [
  Role.HR,
  Role.MANAGER,
  Role.EMPLOYEE,
];
