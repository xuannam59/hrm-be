import { EImportEmployeeColumns } from '../constants/employee.constant';

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

export interface IEmployeeImportRow {
  [EImportEmployeeColumns.FIRST_NAME]: string | undefined;
  [EImportEmployeeColumns.LAST_NAME]: string | undefined;
  [EImportEmployeeColumns.EMAIL]: string | undefined;
  [EImportEmployeeColumns.DEPARTMENT_ID]: string | undefined;
  [EImportEmployeeColumns.POSITION]: string | undefined;
  [EImportEmployeeColumns.HIRE_DATE]?: string;
  [EImportEmployeeColumns.PHONE]: string | undefined;
  [EImportEmployeeColumns.ADDRESS]: string | undefined;
  [EImportEmployeeColumns.GENDER]: string | undefined;
  [EImportEmployeeColumns.BIRTHDAY]: string | undefined;
  [EImportEmployeeColumns.BASIC_SALARY]: string | undefined;
  [EImportEmployeeColumns.STATUS]: string | undefined;
}
