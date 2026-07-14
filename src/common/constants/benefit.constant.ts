export const BENEFIT_SELECT = [
  'employeeBenefit.id',
  'employeeBenefit.employeeId',
  'employeeBenefit.benefitType',
  'employeeBenefit.benefitName',
  'employeeBenefit.valueType',
  'employeeBenefit.value',
  'employeeBenefit.effectiveFrom',
  'employeeBenefit.effectiveTo',
  'employeeBenefit.isActive',
  'employeeBenefit.createdAt',
  'employeeBenefit.updatedAt',
  'employee.id',
  'employee.firstName',
  'employee.lastName',
  'employee.departmentId',
];

export const ALLOWED_SORT_FIELDS_BENEFIT = [
  'id',
  'employeeId',
  'benefitType',
  'valueType',
  'value',
  'effectiveFrom',
  'effectiveTo',
  'createdAt',
];

export enum EBenefitType {
  ANNUAL_LEAVE = 'ANNUAL_LEAVE',
  ALLOWANCE = 'ALLOWANCE',
  BONUS = 'BONUS',
  OTHER = 'OTHER',
}

export enum EBenefitValueType {
  AMOUNT = 'AMOUNT',
  DAY = 'DAY',
  PERCENT = 'PERCENT',
}
