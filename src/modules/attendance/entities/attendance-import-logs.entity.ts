import { EAttendanceImportLogStatus } from '@/common/constants/attendance.constant';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AttendanceImportJobsEntity } from './attendance-import-jobs.entity';
import { BaseEntity } from '@/common/bases/entity.base';

@Entity('attendance_import_logs')
export class AttendanceImportLogsEntity extends BaseEntity {
  @Column({ name: 'job_id' })
  jobId!: number;

  @Column({ name: 'batch_index' })
  batchIndex!: number;

  @Column({
    type: 'enum',
    enum: EAttendanceImportLogStatus,
    default: EAttendanceImportLogStatus.PROCESSING,
  })
  status!: EAttendanceImportLogStatus;

  @Column({ name: 'success_count', default: 0, type: 'int' })
  successCount!: number;

  @Column({ name: 'error_count', default: 0, type: 'int' })
  errorCount!: number;

  @Column({ name: 'error_messages', nullable: true, type: 'text' })
  errorMessages!: string | null;

  @Column({ name: 'retry_of_log_id', nullable: true, type: 'int' })
  retryOfLogId!: number | null;

  @Column({ name: 'row_from' })
  rowFrom!: number;

  @Column({ name: 'row_to' })
  rowTo!: number;

  @ManyToOne(() => AttendanceImportJobsEntity, (job) => job.logs)
  @JoinColumn({ name: 'job_id' })
  job!: AttendanceImportJobsEntity;

  @ManyToOne(() => AttendanceImportLogsEntity, { nullable: true })
  @JoinColumn({ name: 'retry_of_log_id' })
  retryOf!: AttendanceImportLogsEntity | null;
}
