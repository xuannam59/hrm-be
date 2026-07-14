import { ERole, EUserStatus } from '../constants/user.constant';

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
