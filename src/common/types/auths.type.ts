import { Role } from '../constants/role.constant';
import { type IUser } from './user.type';

export interface ILoginResponse {
  access_token: string;
  user: IUser;
}

export interface IPayloadToken {
  sub: number;
  email: string;
  role: Role;
  status: string;
}
