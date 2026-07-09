import { ERole } from '../constants/role.constant';

export interface IUserEmployee {
  id: number;
  departmentId: number;
}

export interface IUser {
  id: number;
  email: string;
  displayName: string;
  role: ERole;
  status: EUserStatus;
  employee: IUserEmployee;
}

export enum EUserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
}
