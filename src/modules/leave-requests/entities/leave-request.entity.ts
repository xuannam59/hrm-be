import { EntityBase } from '@/common/bases/entity.base';
import {
  LeaveRequestStatus,
  LeaveType,
} from '@/common/types/leave-request.type';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('LeaveRequest')
@Index(['employeeId'])
@Index(['status'])
export class LeaveRequestEntity extends EntityBase {
  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'enum', enum: LeaveType, name: 'leave_type' })
  leaveType: LeaveType;

  @Column({ type: 'text', name: 'reason', nullable: true })
  reason?: string;

  @Column({
    type: 'enum',
    enum: LeaveRequestStatus,
    default: LeaveRequestStatus.PENDING,
  })
  status: LeaveRequestStatus;

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById?: number;

  @Column({ type: 'text', name: 'note', nullable: true })
  note?: string;

  @ManyToOne(() => EmployeeEntity)
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: EmployeeEntity;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.leaveRequests)
  @JoinColumn({ name: 'employee_id' })
  employee: EmployeeEntity;
}
