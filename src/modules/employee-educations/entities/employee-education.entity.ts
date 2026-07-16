import { BaseEntity } from '@/common/bases/entity.base';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('EmployeeEducation')
export class EmployeeEducationEntity extends BaseEntity {
  @Column({ type: 'int', name: 'employee_id' })
  employeeId!: number;

  @Column({ type: 'varchar' })
  school!: string;

  @Column({ type: 'varchar' })
  degree!: string;

  @Column({ type: 'varchar', name: 'field_of_study' })
  fieldOfStudy!: string;

  @Column({ type: 'int', name: 'start_year' })
  startYear!: number;

  @Column({ type: 'int', nullable: true, name: 'end_year' })
  endYear?: number;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.educations)
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;
}
