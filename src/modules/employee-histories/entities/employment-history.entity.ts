import { EntityBase } from '@/common/bases/entity.base';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EmployeeEntity } from '../../employees/entities/employee.entity';
import { DepartmentEntity } from '@/modules/departments/entities/department.entity';

@Entity('EmploymentHistory')
export class EmploymentHistoryEntity extends EntityBase {
  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ name: 'department_id' })
  departmentId: number;

  @Column()
  position: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.employmentHistories)
  @JoinColumn({ name: 'employee_id' })
  employee: EmployeeEntity;

  @ManyToOne(
    () => DepartmentEntity,
    (department) => department.employmentHistories,
  )
  @JoinColumn({ name: 'department_id' })
  department: DepartmentEntity;
}
