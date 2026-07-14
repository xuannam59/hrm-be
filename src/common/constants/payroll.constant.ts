export enum EPayrollStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export const PAYROLL_SELECT = [
  'payroll.id',
  'payroll.payrollMonth',
  'payroll.basicSalary',
  'payroll.standardWorkingDays',
  'payroll.workDays',
  'payroll.allowanceAmount',
  'payroll.bonusAmount',
  'payroll.grossSalary',
  'payroll.netSalary',
  'payroll.status',
  'payroll.healthInsuranceAmount',
  'payroll.socialInsuranceAmount',
  'payroll.createdAt',
  'payroll.updatedAt',
  'employee.id',
  'employee.firstName',
  'employee.lastName',
  'employee.departmentId',
  'employee.status',
];

export const ALLOWED_SORT_FIELDS_PAYROLL = [
  'id',
  'employeeId',
  'payrollMonth',
  'basicSalary',
  'standardWorkingDays',
  'workDays',
  'allowanceAmount',
  'bonusAmount',
  'grossSalary',
  'netSalary',
  'status',
  'createdAt',
  'updatedAt',
];
