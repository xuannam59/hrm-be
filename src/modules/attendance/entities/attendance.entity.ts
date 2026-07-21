import { BaseEntity } from '@/common/bases/entity.base';
import { EAttendanceStatus } from '@/common/constants/attendance.constant';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('attendances')
@Index(['employeeId', 'workDate'], { unique: true })
export class AttendanceEntity extends BaseEntity {
  @Column({ name: 'employee_id' })
  employeeId!: number;

  @Column({ type: 'date', name: 'work_date' })
  workDate!: Date;

  @Column({ type: 'time', name: 'check_in' })
  checkIn!: string;

  @Column({ type: 'time', name: 'check_out' })
  checkOut!: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'work_hours',
  })
  workHours!: number;

  @Column({ type: 'enum', name: 'status', enum: EAttendanceStatus })
  status!: EAttendanceStatus;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.attendances)
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;
}
