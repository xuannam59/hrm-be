export const EMPLOYEE_SELECT = [
  'employee.id',
  'employee.firstName',
  'employee.lastName',
  'employee.avatar',
  'employee.position',
  'employee.status',
  'employee.createdAt',
  'employee.updatedAt',
  'user.id',
  'user.email',
  'user.status',
  'user.lastLogin',
  'user.role',
  'department.id',
  'department.name',
  'employmentHistories.id',
  'employmentHistories.position',
  'employmentHistories.startDate',
  'employmentHistories.endDate',
  'educations.id',
  'educations.school',
  'educations.degree',
  'educations.fieldOfStudy',
];

export const ALLOWED_SORT_FIELDS_EMPLOYEE = [
  'id',
  'firstName',
  'lastName',
  'phone',
  'address',
  'birthday',
  'gender',
  'avatar',
  'position',
  'status',
];

export enum EImportEmployeeColumns {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
  DEPARTMENT_ID = 'departmentId',
  POSITION = 'position',
  HIRE_DATE = 'hireDate',
  PHONE = 'phone',
  ADDRESS = 'address',
  GENDER = 'gender',
  BIRTHDAY = 'birthday',
  BASIC_SALARY = 'basicSalary',
  STATUS = 'status',
}

export const GENDER_VALUES = ['OTHER', 'MALE', 'FEMALE'];
export const STATUS_VALUES = ['RETIRED', 'WORKING'];
