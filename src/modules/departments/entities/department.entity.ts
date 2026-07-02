import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';

@Entity('Department')
export class DepartmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'managerId', type: 'int', nullable: true, unique: true })
  managerId: number | null;

  @OneToOne(() => EmployeeEntity, (employee) => employee.managedDepartment)
  @JoinColumn({ name: 'managerId' })
  manager: EmployeeEntity | null;

  @OneToMany(() => EmployeeEntity, (employee) => employee.department)
  employees: EmployeeEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
