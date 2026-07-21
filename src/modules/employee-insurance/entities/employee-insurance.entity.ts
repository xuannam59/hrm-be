import { BaseEntity } from '@/common/bases/entity.base';
import { EInsuranceType } from '@/common/constants/insurance.contant';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('employee_insurances')
@Index(['employeeId'])
export class EmployeeInsuranceEntity extends BaseEntity {
  @Column({ type: 'int', name: 'employee_id' })
  employeeId!: number;

  @Column({ type: 'enum', enum: EInsuranceType, name: 'insurance_type' })
  insuranceType!: EInsuranceType;

  @Column({ type: 'varchar', name: 'insurance_number', unique: true })
  insuranceNumber!: string;

  @Column({ type: 'datetime', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'datetime', name: 'end_date', nullable: true })
  endDate?: Date;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.insurances)
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;
}
