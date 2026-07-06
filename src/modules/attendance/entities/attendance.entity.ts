import { EntityBase } from '@/common/bases/entity.base';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('Attendance')
export class AttendanceEntity extends EntityBase {
  @Column({ type: 'datetime', name: 'check_time' })
  checkTime: Date;

  @Column({ type: 'datetime', name: 'work_date' })
  workDate: Date;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.attendances)
  @JoinColumn({ name: 'employee_id' })
  employee: EmployeeEntity;
}
