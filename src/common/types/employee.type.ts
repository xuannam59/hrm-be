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
  status: EEmployeeStatus;
  departmentId: number;
}

export enum EGenderType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum EEmployeeStatus {
  WORKING = 'WORKING',
  RETIRED = 'RETIRED',
}
