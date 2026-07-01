export interface IUserEmployee {
  id: number;
  departmentId: number;
  employeeCode: string;
}

export interface IUser {
  id: number;
  email: string;
  displayName: string;
  roleId: number;
  status: string;
  employee: IUserEmployee | null;
}
