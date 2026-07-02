import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmployeeStatus } from '@/common/enums/employee-status.enum';
import { DepartmentEntity } from '@/modules/departments/entities/department.entity';
import { UserEntity } from '@/modules/users/entities/user.entity';

@Entity('Employee')
export class EmployeeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  employeeCode: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  gender: string;

  @Column({ type: 'datetime', nullable: true })
  birthday: Date | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar: string | null;

  @Column({ type: 'datetime' })
  hireDate: Date;

  @Column()
  position: string;

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.WORKING,
  })
  status: EmployeeStatus;

  @Column({ name: 'department_id' })
  departmentId: number;

  @ManyToOne(() => DepartmentEntity, (department) => department.employees)
  @JoinColumn({ name: 'department_id' })
  department: DepartmentEntity;

  @OneToOne(() => UserEntity, (user) => user.employee)
  user: UserEntity | null;

  @OneToOne(() => DepartmentEntity, (department) => department.manager)
  managedDepartment: DepartmentEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
