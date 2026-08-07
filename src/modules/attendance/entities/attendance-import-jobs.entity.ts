import { EAttendanceImportStatus } from '@/common/constants/attendance.constant';
import { Column, Entity, OneToMany } from 'typeorm';
import { AttendanceImportLogsEntity } from './attendance-import-logs.entity';
import { BaseEntity } from '@/common/bases/entity.base';

@Entity('attendance_import_jobs')
export class AttendanceImportJobsEntity extends BaseEntity {
  @Column({ name: 'file_name' })
  fileName!: string;

  @Column({ name: 'file_hash' })
  fileHash!: string;

  @Column({ name: 'file_path' })
  filePath!: string;

  @Column({ name: 'total_batches' })
  totalBatches!: number;

  @Column({ name: 'total_rows' })
  totalRows!: number;

  @Column({
    type: 'enum',
    enum: EAttendanceImportStatus,
    default: EAttendanceImportStatus.PENDING,
  })
  status!: EAttendanceImportStatus;

  @OneToMany(() => AttendanceImportLogsEntity, (log) => log.job)
  logs!: AttendanceImportLogsEntity[];
}
