import { EmployeeStatus } from '@/common/enums/employee-status.enum';

export interface IEmployee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthday: Date;
  phone: string;
  email: string;
  address: string;
  avatar: string;
  hireDate: Date;
  position: string;
  status: EmployeeStatus;
  departmentId: number;
}

export enum GenderType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}
