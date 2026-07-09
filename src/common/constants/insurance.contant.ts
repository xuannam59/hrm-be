import { EInsuranceType } from '../types/insurance.type';

export const INSURANCE_SELECT = [
  'employeeInsurance.id',
  'employeeInsurance.employeeId',
  'employeeInsurance.insuranceType',
  'employeeInsurance.insuranceNumber',
  'employeeInsurance.startDate',
  'employeeInsurance.endDate',
  'employeeInsurance.isActive',
  'employeeInsurance.createdAt',
  'employee.id',
  'employee.firstName',
  'employee.lastName',
  'employee.departmentId',
];

export const ALLOWED_SORT_FIELDS_INSURANCE = [
  'id',
  'employeeId',
  'startDate',
  'endDate',
  'insuranceType',
  'createdAt',
];

export const INSURANCE_RATE = {
  HEALTH: 0.015,
  SOCIAL: 0.08,
};
