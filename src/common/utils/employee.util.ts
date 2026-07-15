import {
  EImportEmployeeColumns,
  GENDER_VALUES,
  STATUS_VALUES,
} from '../constants/employee.constant';
import { ROLE_VALUES } from '../constants/user.constant';
import { IEmployeeImportRow } from '../types/employee.type';

export const validateEmployeeImportHeaders = (headers: string[]) => {
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] !== Object.values(EImportEmployeeColumns)[i]) {
      return false;
    }
  }
  return true;
};

export const validateEmployeeImport = (employee: IEmployeeImportRow) => {
  const errors: string[] = [];
  if (!employee[EImportEmployeeColumns.FIRST_NAME]) {
    errors.push('First name is required');
  }

  if (!employee[EImportEmployeeColumns.LAST_NAME]) {
    errors.push('Last name is required');
  }

  if (!employee[EImportEmployeeColumns.EMAIL]) {
    errors.push('Email is required');
  } else if (!validateEmail(employee[EImportEmployeeColumns.EMAIL])) {
    errors.push('Email is not valid format');
  }

  if (!employee[EImportEmployeeColumns.DEPARTMENT_ID]) {
    errors.push('DepartmentID is required');
  }

  if (
    !employee[EImportEmployeeColumns.ROLE] &&
    employee[EImportEmployeeColumns.ROLE] != 0
  ) {
    errors.push('Role is required');
  } else if (!ROLE_VALUES[employee[EImportEmployeeColumns.ROLE]]) {
    errors.push('Role has a value of 0, 1 or 2');
  }

  if (!employee[EImportEmployeeColumns.HIRE_DATE]) {
    errors.push('Hire date is required');
  } else if (!isValiDate(employee[EImportEmployeeColumns.HIRE_DATE])) {
    errors.push('Hire date is not valid format');
  }

  if (!employee[EImportEmployeeColumns.PHONE]) {
    errors.push('Phone is required');
  }

  if (!employee[EImportEmployeeColumns.STATUS]) {
    errors.push('Status is required');
  } else if (!STATUS_VALUES[employee[EImportEmployeeColumns.STATUS]]) {
    errors.push('Status has a value of 0 or 1');
  }

  if (
    employee[EImportEmployeeColumns.BIRTHDAY] &&
    !isValiDate(employee[EImportEmployeeColumns.BIRTHDAY])
  ) {
    errors.push('Birthday is not valid format');
  }

  if (
    employee[EImportEmployeeColumns.GENDER] &&
    !GENDER_VALUES[employee[EImportEmployeeColumns.GENDER]]
  ) {
    errors.push('Gender has a value of 0, 1 or 2');
  }

  if (
    employee[EImportEmployeeColumns.BASIC_SALARY] &&
    Number.isNaN(Number(employee[EImportEmployeeColumns.BASIC_SALARY]))
  ) {
    errors.push('Basic salary is not a number');
  }

  return errors;
};

const isValiDate = (dateString: string) => {
  const regex = /^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/;

  if (!regex.test(dateString)) return false;

  const year = parseInt(dateString.slice(0, 4));
  const month = parseInt(dateString.slice(4, 6));
  const day = parseInt(dateString.slice(6, 8));

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const validateEmail = (email: string) => {
  const regex = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'i');
  return regex.test(email);
};

export const convertEmployeeDataToObject = (
  data: string[][],
): IEmployeeImportRow[] => {
  return data.map((row) => {
    return {
      [EImportEmployeeColumns.FIRST_NAME]: row[0] || undefined,
      [EImportEmployeeColumns.LAST_NAME]: row[1] || undefined,
      [EImportEmployeeColumns.EMAIL]: row[2] || undefined,
      [EImportEmployeeColumns.DEPARTMENT_ID]: Number(row[3]) || undefined,
      [EImportEmployeeColumns.ROLE]: Number(row[4]) || 0,
      [EImportEmployeeColumns.HIRE_DATE]: row[5] || undefined,
      [EImportEmployeeColumns.PHONE]: row[6] || undefined,
      [EImportEmployeeColumns.ADDRESS]: row[7] || undefined,
      [EImportEmployeeColumns.GENDER]: Number(row[8]) || 0,
      [EImportEmployeeColumns.BIRTHDAY]: row[9] || undefined,
      [EImportEmployeeColumns.BASIC_SALARY]: Number(row[10]) || 0,
      [EImportEmployeeColumns.STATUS]: Number(row[11]) || 0,
    };
  });
};
