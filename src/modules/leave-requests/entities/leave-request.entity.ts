import { BaseEntity } from '@/common/bases/entity.base';
import {
  ELeaveRequestStatus,
  ELeaveType,
} from '@/common/types/leave-request.type';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('LeaveRequest')
@Index(['employeeId'])
@Index(['status'])
@Index(['approverId'])
export class LeaveRequestEntity extends BaseEntity {
  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ type: 'datetime', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'datetime', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'enum', enum: ELeaveType, name: 'leave_type' })
  leaveType: ELeaveType;

  @Column({ type: 'text', name: 'reason', nullable: true })
  reason?: string;

  @Column({
    type: 'enum',
    enum: ELeaveRequestStatus,
    default: ELeaveRequestStatus.PENDING,
  })
  status: ELeaveRequestStatus;

  @Column({ name: 'assigned_by_id' })
  approverId: number;

  @Column({ type: 'int', name: 'number_of_days' })
  numberOfDays: number;

  @Column({ type: 'text', name: 'note', nullable: true })
  note?: string;

  @ManyToOne(() => EmployeeEntity)
  @JoinColumn({ name: 'assigned_by_id' })
  approver: EmployeeEntity;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.leaveRequests)
  @JoinColumn({ name: 'employee_id' })
  employee: EmployeeEntity;
}
