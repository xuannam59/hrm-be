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
  status: EmployeeStatusType;
  departmentId: number;
}

export enum EmployeeStatusType {
  WORKING = 'WORKING',
  RESIGNED = 'RESIGNED',
  MATERNITY = 'MATERNITY',
  RETIRED = 'RETIRED',
}

export enum GenderType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}
