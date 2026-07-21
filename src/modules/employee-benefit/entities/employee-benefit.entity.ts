import { BaseEntity } from '@/common/bases/entity.base';
import {
  EBenefitType,
  EBenefitValueType,
} from '@/common/constants/benefit.constant';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('employee_benefits')
@Index(['employeeId'])
export class EmployeeBenefitEntity extends BaseEntity {
  @Column({ type: 'int', name: 'employee_id' })
  employeeId!: number;

  @Column({ type: 'enum', enum: EBenefitType })
  benefitType!: EBenefitType;

  @Column({ type: 'varchar', name: 'benefit_name' })
  benefitName!: string;

  @Column({ type: 'enum', enum: EBenefitValueType, name: 'value_type' })
  valueType!: EBenefitValueType;

  @Column({ type: 'decimal', name: 'value', precision: 10, scale: 2 })
  value!: number;

  @Column({ type: 'datetime', name: 'effective_from' })
  effectiveFrom!: Date;

  @Column({ type: 'datetime', name: 'effective_to', nullable: true })
  effectiveTo?: Date;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.benefits)
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;
}
