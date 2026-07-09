import { BaseEntity } from '@/common/bases/entity.base';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EmployeeEntity } from '../../employees/entities/employee.entity';
import { DepartmentEntity } from '@/modules/departments/entities/department.entity';

@Entity('EmploymentHistory')
export class EmploymentHistoryEntity extends BaseEntity {
  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ name: 'department_id' })
  departmentId: number;

  @Column()
  position: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate?: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    name: 'basic_salary',
  })
  basicSalary: number;

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
