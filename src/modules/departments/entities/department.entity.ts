import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { BaseEntity } from '@/common/bases/entity.base';
import { EmploymentHistoryEntity } from '@/modules/employee-histories/entities/employment-history.entity';

@Entity('departments')
export class DepartmentEntity extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'managerId', type: 'int', nullable: true, unique: true })
  managerId?: number;

  @OneToOne(() => EmployeeEntity, (employee) => employee.managedDepartment)
  @JoinColumn({ name: 'managerId' })
  manager?: EmployeeEntity;

  @OneToMany(() => EmployeeEntity, (employee) => employee.department)
  employees!: EmployeeEntity[];

  @OneToMany(
    () => EmploymentHistoryEntity,
    (employmentHistory) => employmentHistory.department,
  )
  employmentHistories!: EmploymentHistoryEntity[];
}
