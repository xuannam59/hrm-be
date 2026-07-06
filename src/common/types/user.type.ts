import { Role } from '../constants/role.constant';

export interface IUserEmployee {
  id: number;
  departmentId: number;
  employeeCode: string;
}

export interface IUser {
  id: number;
  email: string;
  displayName: string;
  role: Role;
  status: string;
  employee: IUserEmployee;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
}
