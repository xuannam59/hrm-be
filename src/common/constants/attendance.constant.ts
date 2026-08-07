export const START_WORK_TIME = '08:30:00';

export const END_WORK_TIME = '17:30:00';

export const BREAK_TIME_START = '12:00:00';

export const BREAK_TIME_END = '13:00:00';

export const WORK_HOURS = 8;

export const TIME_FORMAT = /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/;

export enum EAttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  WORK_FROM_HOME = 'WORK_FROM_HOME',
}

export enum EAttendanceType {
  IN = 'IN',
  OUT = 'OUT',
}

export enum EAttendanceRecordType {
  OUR_HRM = 'our-hrm',
  FROM_OLD_SYSTEM = 'from_old_system',
}

export enum EAttendanceImportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum EAttendanceImportLogStatus {
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export const ATTENDANCE_IMPORT_COLUMNS = {
  COLUMNS: ['employeeId', 'workDate', 'checkIn', 'checkOut', 'status'],
  COLUMN_INDEXES: {
    EMPLOYEE_ID: 0,
    WORK_DATE: 1,
    CHECK_IN: 2,
    CHECK_OUT: 3,
    STATUS: 4,
  },
};
