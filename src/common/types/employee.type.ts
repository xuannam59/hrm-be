import {
  EEmployeeStatus,
  EImportEmployeeColumns,
} from '../constants/employee.constant';

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

export interface IEmployeeImportRow {
  [EImportEmployeeColumns.FIRST_NAME]: string | undefined;
  [EImportEmployeeColumns.LAST_NAME]: string | undefined;
  [EImportEmployeeColumns.EMAIL]: string | undefined;
  [EImportEmployeeColumns.DEPARTMENT_ID]: number | undefined;
  [EImportEmployeeColumns.ROLE]: number;
  [EImportEmployeeColumns.HIRE_DATE]?: string;
  [EImportEmployeeColumns.PHONE]: string | undefined;
  [EImportEmployeeColumns.ADDRESS]: string | undefined;
  [EImportEmployeeColumns.GENDER]: number;
  [EImportEmployeeColumns.BIRTHDAY]: string | undefined;
  [EImportEmployeeColumns.BASIC_SALARY]: number;
  [EImportEmployeeColumns.STATUS]: number;
}
