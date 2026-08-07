import { MessageEvent } from '@nestjs/common';
import {
  EAttendanceImportStatus,
  EAttendanceRecordType,
  EAttendanceStatus,
} from '../constants/attendance.constant';

export type AttendanceImportRow = {
  rowIndex: number;
  employeeId: number;
  workDate: string;
  checkIn: string;
  checkOut: string;
  workHours: number;
  recordType: EAttendanceRecordType;
  status: EAttendanceStatus;
};

export type AttendanceImportError = {
  rowIndex: number;
  errors: string[];
};

export type IAttendanceImportProgress = Omit<MessageEvent, 'data'> & {
  data: IAttendanceImportProgressData;
};

export type IAttendanceImportProgressData = {
  jobId: number;
  progress: number;
  successCount: number;
  errorCount: number;
  status: EAttendanceImportStatus;
};
