import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUser } from '@/common/types/user.type';
import SearchEmployeeQueryDto from './dto/search-employee-query.dto';
import CreateEmployeeDto from './dto/create-employee.dto';
import ProvisionAccountDto from '@/modules/users/dto/provision-account.dto';
import {
  buildDisplayName,
  requireEmployee,
} from '@/common/utils/user-context.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { EmployeeEntity } from './entities/employee.entity';
import { DepartmentEntity } from '../departments/entities/department.entity';
import { Role } from '@/common/constants/role.constant';
import { IPaginationResponse } from '@/common/types/common.type';
import { UserEntity } from '../users/entities/user.entity';
import { UserStatus } from '@/common/types/user.type';
import { EmployeeStatus } from '@/common/types/employee.type';
import { hashString } from '@/common/utils/crypto.util';
import UpdateEmployeeDto from './dto/update-employee.dto';
import { generateNextEmployeeCode } from '@/common/utils/employee-code.util';
import UpdateEmployeeProfileDto from './dto/update-employee-profile.dto';
import { EmploymentHistoryEntity } from '../employee-histories/entities/employment-history.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(EmploymentHistoryEntity)
    private readonly employmentHistoryRepository: Repository<EmploymentHistoryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private readonly logger = new Logger(EmployeesService.name);

  async getAllEmployees(
    query: SearchEmployeeQueryDto,
    actor: IUser,
  ): Promise<IPaginationResponse<EmployeeEntity>> {
    try {
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        departmentId,
        status,
        position,
      } = query;
      const pageNumber = page ?? 1;
      const limitNumber = limit ?? 10;
      const sortByField = sortBy ?? 'createdAt';
      const sortOrderDirection = sortOrder ?? 'DESC';
      const skip = (pageNumber - 1) * limitNumber;

      const queryBuilder = this.employeeRepository
        .createQueryBuilder('employee')
        .leftJoinAndSelect('employee.user', 'user')
        .leftJoinAndSelect('employee.department', 'department')
        .leftJoinAndSelect(
          'employee.employmentHistories',
          'employmentHistories',
        )
        .select([
          'employee.id',
          'employee.employeeCode',
          'employee.firstName',
          'employee.lastName',
          'employee.avatar',
          'employee.position',
          'employee.status',
          'employee.createdAt',
          'employee.updatedAt',
          'user.id',
          'user.email',
          'user.displayName',
          'user.status',
          'user.lastLogin',
          'user.role',
          'department.id',
          'department.name',
          'employmentHistories.id',
          'employmentHistories.position',
          'employmentHistories.startDate',
          'employmentHistories.endDate',
        ]);

      if (search) {
        queryBuilder.orWhere(
          new Brackets((qb) => {
            qb.where('employee.firstName LIKE :search', {
              search: `%${search}%`,
            });
            qb.orWhere('employee.lastName LIKE :search', {
              search: `%${search}%`,
            });
            qb.orWhere('employee.employeeCode LIKE :search', {
              search: `%${search}%`,
            });
          }),
        );
      }

      if (actor.role === Role.MANAGER) {
        const employee = requireEmployee(actor);
        queryBuilder.andWhere('employee.departmentId = :departmentId', {
          departmentId: employee.departmentId,
        });
      } else if (departmentId) {
        queryBuilder.andWhere('employee.departmentId = :departmentId', {
          departmentId,
        });
      }

      if (status) {
        queryBuilder.andWhere('employee.status = :status', { status });
      }
      if (position) {
        queryBuilder.andWhere('employee.position = :position', { position });
      }

      const [employees, total] = await queryBuilder
        .orderBy(`employee.${sortByField}`, sortOrderDirection)
        .skip(skip)
        .take(limitNumber)
        .getManyAndCount();

      return {
        result: employees,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: total,
          totalPages: Math.ceil(total / limitNumber),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async createEmployee(createEmployeeDto: CreateEmployeeDto) {
    try {
      if (
        createEmployeeDto.account &&
        createEmployeeDto.account.role === Role.ADMIN
      ) {
        throw new BadRequestException(
          'Admin role cannot be created as employee',
        );
      }

      const departmentInfo = await this.departmentRepository.findOne({
        where: { id: createEmployeeDto.departmentId },
      });

      if (!departmentInfo) {
        throw new NotFoundException('Department not found');
      }

      if (createEmployeeDto.account) {
        const userInfo = await this.userRepository.findOne({
          where: { email: createEmployeeDto.account.email },
          select: { id: true },
        });

        if (userInfo) {
          throw new BadRequestException('Email already exists');
        }
      }

      return await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          const employeeCode = await generateNextEmployeeCode(
            transactionalEntityManager,
          );
          const employee = transactionalEntityManager.create(EmployeeEntity, {
            employeeCode: employeeCode,
            firstName: createEmployeeDto.firstName.trim(),
            lastName: createEmployeeDto.lastName.trim(),
            gender: createEmployeeDto.gender,
            birthday: createEmployeeDto.birthday,
            phone: createEmployeeDto.phone,
            address: createEmployeeDto.address,
            hireDate: createEmployeeDto.hireDate,
            position: createEmployeeDto.position,
            departmentId: createEmployeeDto.departmentId,
            status: createEmployeeDto.status,
          });
          await transactionalEntityManager.save(employee);

          const employmentHistory = transactionalEntityManager.create(
            EmploymentHistoryEntity,
            {
              employeeId: employee.id,
              departmentId: createEmployeeDto.departmentId,
              position: createEmployeeDto.position,
              startDate: createEmployeeDto.hireDate,
            },
          );
          await transactionalEntityManager.save(employmentHistory);

          if (createEmployeeDto.account) {
            let userStatus = UserStatus.INACTIVE;

            if (createEmployeeDto.status === EmployeeStatus.WORKING) {
              userStatus = UserStatus.ACTIVE;
            }

            const displayName = buildDisplayName(
              employee.firstName,
              employee.lastName,
            );

            const passwordHash = await hashString(
              createEmployeeDto.account.password,
            );

            const user = transactionalEntityManager.create(UserEntity, {
              email: createEmployeeDto.account.email,
              displayName: displayName,
              password: passwordHash,
              role: createEmployeeDto.account.role,
              status: userStatus,
              employeeId: employee.id,
            });
            await transactionalEntityManager.save(user);
            employee.user = {
              ...user,
              password: createEmployeeDto.account.password,
            };
          }
          this.logger.log(
            `Employee ${employee.firstName} ${employee.lastName} created successfully by ${createEmployeeDto.account?.email}`,
          );
          return employee;
        },
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async provisionAccount(
    employeeId: number,
    provisionAccountDto: ProvisionAccountDto,
  ) {
    try {
      if (provisionAccountDto.role === Role.ADMIN) {
        throw new BadRequestException('Admin role cannot be provisioned');
      }

      const [employeeInfo, userInfo] = await Promise.all([
        this.employeeRepository.findOne({
          where: { id: employeeId },
          relations: { user: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            user: {
              id: true,
            },
          },
        }),
        this.userRepository.findOne({
          where: { email: provisionAccountDto.email },
          select: { id: true },
        }),
      ]);

      if (!employeeInfo) {
        throw new NotFoundException('Employee not found');
      }

      if (employeeInfo.user) {
        throw new BadRequestException('Employee already has an account');
      }

      if (userInfo) {
        throw new BadRequestException('Email already exists');
      }

      return await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          const displayName = buildDisplayName(
            employeeInfo.firstName,
            employeeInfo.lastName,
          );

          const userStatus =
            employeeInfo.status === EmployeeStatus.WORKING
              ? UserStatus.ACTIVE
              : UserStatus.INACTIVE;

          const passwordHash = await hashString(provisionAccountDto.password);

          const user = transactionalEntityManager.create(UserEntity, {
            email: provisionAccountDto.email,
            displayName: displayName,
            password: passwordHash,
            role: provisionAccountDto.role,
            status: userStatus,
            employeeId: employeeInfo.id,
          });

          await transactionalEntityManager.save(user);
          employeeInfo.user = user;
          this.logger.log(
            `Employee ${displayName} provisioned account successfully by ${provisionAccountDto.email}`,
          );
          return employeeInfo;
        },
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async updateEmployee(
    employeeId: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ) {
    try {
      const employeeInfo = await this.employeeRepository.findOne({
        where: { id: employeeId },
        relations: { user: true },
        select: {
          id: true,
        },
      });

      if (!employeeInfo) {
        throw new NotFoundException('Employee not found');
      }

      if (updateEmployeeDto.departmentId) {
        const departmentInfo = await this.departmentRepository.findOne({
          where: { id: updateEmployeeDto.departmentId },
        });
        if (!departmentInfo) {
          throw new NotFoundException('Department not found');
        }
      }

      return await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          await transactionalEntityManager.update(
            EmployeeEntity,
            employeeId,
            updateEmployeeDto,
          );
          this.logger.log(
            `Employee ${employeeInfo.firstName} ${employeeInfo.lastName} updated successfully`,
          );
          return 'Update employee successful';
        },
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async updateProfile(
    updateProfileDto: UpdateEmployeeProfileDto,
    actor: IUser,
  ) {
    try {
      const employeeInfo = requireEmployee(actor);

      if (!employeeInfo) {
        throw new NotFoundException('Employee not found');
      }

      const dataUpdate: Partial<EmployeeEntity> = {
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName,
        gender: updateProfileDto.gender,
        phone: updateProfileDto.phone,
        address: updateProfileDto.address,
        birthday: updateProfileDto.birthday,
      };

      if (updateProfileDto.avatar) {
        dataUpdate.avatar = updateProfileDto.avatar;
      }

      return await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          await transactionalEntityManager.update(
            EmployeeEntity,
            employeeInfo.id,
            dataUpdate,
          );

          const displayName = buildDisplayName(
            updateProfileDto.firstName,
            updateProfileDto.lastName,
          );
          await transactionalEntityManager.update(UserEntity, actor.id, {
            displayName: displayName,
          });

          this.logger.log(
            `Employee ${displayName} updated profile successfully by ${actor.email}`,
          );
          return 'Update employee profile successful';
        },
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
