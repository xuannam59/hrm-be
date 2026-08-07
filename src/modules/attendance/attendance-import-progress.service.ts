import { EAttendanceImportStatus } from '@/common/constants/attendance.constant';
import {
  IAttendanceImportProgress,
  IAttendanceImportProgressData,
} from '@/common/types/attendance.type';
import { Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class AttendanceImportProgressService {
  private readonly connections = new Map<
    number,
    BehaviorSubject<IAttendanceImportProgress>
  >();

  getOrCreate(jobId: number): BehaviorSubject<IAttendanceImportProgress> {
    let subject = this.connections.get(jobId);

    if (!subject) {
      subject = new BehaviorSubject<IAttendanceImportProgress>({
        data: {
          jobId,
          progress: 0,
          successCount: 0,
          errorCount: 0,
          status: EAttendanceImportStatus.PROCESSING,
        },
      });
      this.connections.set(jobId, subject);
    }

    return subject;
  }

  send(jobId: number, data: IAttendanceImportProgressData) {
    this.getOrCreate(jobId).next({ data, type: 'attendance-import-progress' });
  }

  complete(jobId: number) {
    const subject = this.connections.get(jobId);
    if (!subject) return;
    subject.complete();
    this.connections.delete(jobId);
  }
}
