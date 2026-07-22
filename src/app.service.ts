import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { UserEntity } from './modules/users/entities/user.entity';
import { EmployeeEntity } from './modules/employees/entities/employee.entity';
import { DepartmentEntity } from './modules/departments/entities/department.entity';
import { EGenderType } from './common/constants/employee.constant';
import { hashString } from './common/utils/crypto.util';
import { ERole } from './common/constants/user.constant';
import { buildDisplayName } from './common/utils/user-context.util';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(AppService.name);

  async onModuleInit() {
    try {
      const init = this.configService.get<string>('SHOULD_INIT');
      if (init === 'true') {
        const countEmployee = await this.dataSource
          .getRepository(EmployeeEntity)
          .count();
        const countUser = await this.dataSource
          .getRepository(UserEntity)
          .count();
        const countDepartment = await this.dataSource
          .getRepository(DepartmentEntity)
          .count();

        if (countDepartment === 0) {
          await this.dataSource.getRepository(DepartmentEntity).insert([
            {
              name: 'IT',
              description: 'IT Department',
            },
          ]);
        }

        if (countEmployee === 0) {
          const department = await this.dataSource
            .getRepository(DepartmentEntity)
            .findOne({ select: { id: true } });
          await this.dataSource.getRepository(EmployeeEntity).insert([
            {
              firstName: 'Nam',
              lastName: 'Le',
              gender: EGenderType.OTHER,
              phone: '0909090909',
              position: 'Director',
              hireDate: new Date(),
              departmentId: department?.id,
            },
          ]);
        }

        if (countUser === 0) {
          const adminEmployee = await this.dataSource
            .getRepository(EmployeeEntity)
            .findOne({ select: { id: true, firstName: true, lastName: true } });
          const password =
            this.configService.getOrThrow<string>('INIT_PASSWORD');

          await this.dataSource.getRepository(UserEntity).insert([
            {
              email: 'admin@gmail.com',
              password: await hashString(password),
              displayName: buildDisplayName(
                adminEmployee?.firstName || '',
                adminEmployee?.lastName || '',
              ),
              employeeId: adminEmployee?.id,
              role: ERole.ADMIN,
            },
          ]);
        }
      }
    } catch (error: any) {
      this.logger.error(error.message);
    }
  }
}
