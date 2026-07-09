import { ERole } from '@/common/constants/role.constant';
import { IPaginationResponse } from '@/common/types/common.type';
import { EEmployeeStatus } from '@/common/types/employee.type';
import { EUserStatus, IUser } from '@/common/types/user.type';
import { hashString } from '@/common/utils/crypto.util';
import { buildDisplayName } from '@/common/utils/user-context.util';
import ProvisionAccountDto from '@/modules/users/dto/provision-account.dto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, IsNull, Repository } from 'typeorm';
import { DepartmentEntity } from '../departments/entities/department.entity';
import { EmploymentHistoryEntity } from '../employee-histories/entities/employment-history.entity';
import { UserEntity } from '../users/entities/user.entity';
import CreateEmployeeDto from './dto/create-employee.dto';
import SearchEmployeeQueryDto from './dto/search-employee-query.dto';
import UpdateEmployeeProfileDto from './dto/update-employee-profile.dto';
import UpdateEmployeeDto from './dto/update-employee.dto';
import { EmployeeEntity } from './entities/employee.entity';
import {
  ALLOWED_SORT_FIELDS_EMPLOYEE,
  EMPLOYEE_SELECT,
} from '@/common/constants/employee.constant';
import { EmployeeInsuranceEntity } from '../employee-insurance/entities/employee-insurance.entity';
import { EInsuranceType } from '@/common/types/insurance.type';
import { EmployeeBenefitEntity } from '../employee-benefit/entities/employee-benefit.entity';
import { EBenefitType, EBenefitValueType } from '@/common/types/benefit.type';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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
        sortField,
        sortOrder,
        search,
        departmentId,
        status,
        position,
      } = query;
      const skip = (page - 1) * limit;

      const safeSortField = ALLOWED_SORT_FIELDS_EMPLOYEE.includes(sortField)
        ? sortField
        : 'createdAt';

      const queryBuilder = this.employeeRepository
        .createQueryBuilder('employee')
        .leftJoinAndSelect('employee.user', 'user')
        .leftJoinAndSelect('employee.department', 'department')
        .leftJoinAndSelect('employee.educations', 'educations')
        .leftJoinAndSelect(
          'employee.employmentHistories',
          'employmentHistories',
        )
        .orderBy(`employee.${safeSortField}`, sortOrder)
        .skip(skip)
        .take(limit)
        .select(EMPLOYEE_SELECT);

      if (search) {
        queryBuilder.andWhere(
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

      if (actor.role === ERole.MANAGER) {
        queryBuilder.andWhere('employee.departmentId = :departmentId', {
          departmentId: actor.employee.departmentId,
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

      const [employees, total] = await queryBuilder.getManyAndCount();

      return {
        result: employees,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async getMyEmployeeProfile(actor: IUser) {
    try {
      const queryBuilder = this.employeeRepository
        .createQueryBuilder('employee')
        .where('employee.id = :id', { id: actor.employee.id })
        .leftJoinAndSelect('employee.user', 'user')
        .leftJoinAndSelect('employee.department', 'department')
        .leftJoinAndSelect('employee.educations', 'educations')
        .leftJoinAndSelect(
          'employee.employmentHistories',
          'employmentHistories',
        )
        .select(EMPLOYEE_SELECT);

      const employee = await queryBuilder.getOne();

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      return employee;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async createEmployee(createEmployeeDto: CreateEmployeeDto) {
    try {
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
          const employee = transactionalEntityManager.create(EmployeeEntity, {
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

          const insurance = transactionalEntityManager.create(
            EmployeeBenefitEntity,
            {
              employeeId: employee.id,
              benefitType: EBenefitType.ALLOWANCE,
              benefitName: 'Trợ cấp',
              valueType: EBenefitValueType.AMOUNT,
              value: 800000,
              effectiveFrom: createEmployeeDto.hireDate,
            },
          );

          const employmentHistory = transactionalEntityManager.create(
            EmploymentHistoryEntity,
            {
              employeeId: employee.id,
              departmentId: createEmployeeDto.departmentId,
              position: createEmployeeDto.position,
              startDate: createEmployeeDto.hireDate,
              basicSalary: createEmployeeDto.basicSalary,
            },
          );

          await Promise.all([
            transactionalEntityManager.save(insurance),
            transactionalEntityManager.save(employmentHistory),
            transactionalEntityManager.save(employee),
          ]);

          if (createEmployeeDto.account) {
            const userStatus =
              createEmployeeDto.status === EEmployeeStatus.WORKING
                ? EUserStatus.ACTIVE
                : EUserStatus.INACTIVE;

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
              password: undefined as never,
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
        error?.message || 'Internal server error',
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
            employeeInfo.status === EEmployeeStatus.WORKING
              ? EUserStatus.ACTIVE
              : EUserStatus.INACTIVE;

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
        error?.message || 'Internal server error',
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
          user: {
            id: true,
          },
          position: true,
          departmentId: true,
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

          if (updateEmployeeDto.status && employeeInfo.user) {
            await transactionalEntityManager.update(
              UserEntity,
              employeeInfo.user.id,
              {
                status:
                  updateEmployeeDto.status === EEmployeeStatus.WORKING
                    ? EUserStatus.ACTIVE
                    : EUserStatus.INACTIVE,
              },
            );
          }

          const isPositionChanged =
            updateEmployeeDto.position !== undefined &&
            updateEmployeeDto.position !== employeeInfo.position;

          const isDepartmentChanged =
            updateEmployeeDto.departmentId !== undefined &&
            updateEmployeeDto.departmentId !== employeeInfo.departmentId;

          if (isPositionChanged || isDepartmentChanged) {
            const employmentHistory = await transactionalEntityManager.findOne(
              EmploymentHistoryEntity,
              {
                where: { employeeId: employeeId, endDate: IsNull() },
              },
            );

            const data = {
              employeeId,
              departmentId:
                updateEmployeeDto.departmentId ?? employeeInfo.departmentId,
              position: updateEmployeeDto.position ?? employeeInfo.position,
              basicSalary: updateEmployeeDto.basicSalary ?? 0.0,
              startDate: new Date(),
            };

            if (employmentHistory) {
              employmentHistory.endDate = new Date();
              await transactionalEntityManager.save(employmentHistory);

              const basicSalary =
                updateEmployeeDto.basicSalary ?? employmentHistory.basicSalary;

              data.basicSalary = basicSalary;
            }

            const newEmploymentHistory = transactionalEntityManager.create(
              EmploymentHistoryEntity,
              data,
            );

            await transactionalEntityManager.save(newEmploymentHistory);
          }

          this.logger.log(`Employee ${employeeInfo.id} updated successfully`);
          return 'Update employee successful';
        },
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Internal server error',
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
            actor.employee.id,
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
        error?.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
