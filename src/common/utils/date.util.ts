import {
  BREAK_TIME_END,
  BREAK_TIME_START,
  END_WORK_TIME,
  START_WORK_TIME,
} from '@/common/constants/attendance.constant';
import { BadRequestException } from '@nestjs/common';

export const LEAVE_REQUEST_MAX_PAST_DAYS = 7;

export const getTodayWorkDate = (): Date => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  return new Date(y, m, d);
};

export const getEarliestLeaveRequestDate = (): Date => {
  const earliest = getTodayWorkDate();
  earliest.setDate(earliest.getDate() - LEAVE_REQUEST_MAX_PAST_DAYS + 1);
  return earliest;
};

export const getTodayDate = (): string => {
  const workDate = getTodayWorkDate();
  const y = workDate.getFullYear();
  const m = String(workDate.getMonth() + 1).padStart(2, '0');
  const d = String(workDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatLocalTime = (date = new Date()): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const timeToMinutes = (time?: string): number => {
  if (!time) {
    return 0;
  }
  const [h, m, s = '0'] = time.split(':');
  return Number(h) * 60 + Number(m) + Number(s) / 60;
};

export const calculateWorkHours = (
  checkIn: string,
  checkOut: string,
): number => {
  const startWorkTime = timeToMinutes(START_WORK_TIME);
  const endWorkTime = timeToMinutes(END_WORK_TIME);
  const inMinutes = Math.max(startWorkTime, timeToMinutes(checkIn));
  const outMinutes = Math.min(endWorkTime, timeToMinutes(checkOut));

  if (outMinutes <= inMinutes) {
    return 0;
  }

  let total = outMinutes - inMinutes;

  const breakStart = timeToMinutes(BREAK_TIME_START);
  const breakEnd = timeToMinutes(BREAK_TIME_END);

  if (inMinutes < breakEnd && outMinutes > breakStart) {
    const overlapStart = Math.max(inMinutes, breakStart);
    const overlapEnd = Math.min(outMinutes, breakEnd);
    total -= overlapEnd - overlapStart;
  }

  const totalHours = Math.round((total / 60) * 100) / 100;

  return totalHours;
};

export const validateMonth = (month: number) => {
  if (month < 1 || month > 12) {
    throw new BadRequestException('Month must be between 1 and 12');
  }
};

export const validateDay = (year: number, month: number, day: number) => {
  validateMonth(month);
  const lastDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > lastDay) {
    throw new BadRequestException(
      `Day must be between 1 and ${lastDay} for ${month}/${year}`,
    );
  }
};

export const getNumberOfLeaveDays = (
  startDate: Date,
  endDate: Date,
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getWorkingDaysAndWeekendDaysInMonth = (
  year: number,
  month: number,
) => {
  const monthStartDate = new Date(year, month - 1, 1);
  const monthEndDate = new Date(year, month, 0);
  const workingDays: string[] = [];
  const weekendDays: string[] = [];
  for (
    let cursorDate = monthStartDate;
    cursorDate <= monthEndDate;
    cursorDate.setDate(cursorDate.getDate() + 1)
  ) {
    const dayOfWeek = cursorDate.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const nextDayDate = new Date(cursorDate);
      nextDayDate.setHours(0, 0, 0, 0);
      nextDayDate.setDate(nextDayDate.getDate() + 1);
      weekendDays.push(
        `${nextDayDate.getFullYear()}-${nextDayDate.getMonth() + 1}-${nextDayDate.getDate()}`,
      );
    } else {
      workingDays.push(
        `${cursorDate.getFullYear()}-${cursorDate.getMonth() + 1}-${cursorDate.getDate()}`,
      );
    }
  }
  return { weekendDays, workingDays };
};

export const isDateActive = (from: Date, to?: Date, at: Date = new Date()) => {
  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);

  const checkDate = new Date(at);
  checkDate.setHours(0, 0, 0, 0);

  if (fromDate > checkDate) {
    return false;
  }
  if (!to) {
    return true;
  }

  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  return to >= checkDate;
};

export const formatDate = (dateString?: string) => {
  if (!dateString) {
    return undefined;
  }

  const y = dateString.slice(0, 4);
  const m = dateString.slice(4, 6);
  const d = dateString.slice(6, 8);

  return `${y}-${m}-${d}`;
};
