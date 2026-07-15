import { ERole } from './user.constant';

export const EMPLOYEE_SELECT = [
  'employee.id',
  'employee.firstName',
  'employee.lastName',
  'employee.avatar',
  'employee.position',
  'employee.status',
  'employee.hireDate',
  'employee.gender',
  'employee.address',
  'employee.birthday',
  'employee.phone',
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
  ROLE = 'role',
  HIRE_DATE = 'hireDate',
  PHONE = 'phone',
  ADDRESS = 'address',
  GENDER = 'gender',
  BIRTHDAY = 'birthday',
  BASIC_SALARY = 'basicSalary',
  STATUS = 'status',
}

export enum EGenderType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export const GENDER_VALUES: EGenderType[] = [
  EGenderType.OTHER,
  EGenderType.MALE,
  EGenderType.FEMALE,
];

export enum EEmployeeStatus {
  WORKING = 'WORKING',
  RETIRED = 'RETIRED',
}

export const STATUS_VALUES: EEmployeeStatus[] = [
  EEmployeeStatus.RETIRED,
  EEmployeeStatus.WORKING,
];

export const EPositionType = {
  [ERole.EMPLOYEE]: 'Nhân viên',
  [ERole.MANAGER]: 'Trưởng phòng',
  [ERole.ADMIN]: 'Giám đốc',
};

export const POSITION_VALUES = ['Nhân viên', 'Trưởng phòng', 'Giám đốc'];
