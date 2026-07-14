import {
  ALLOWED_SORT_FIELDS_EMPLOYEE,
  EImportEmployeeColumns,
  EMPLOYEE_SELECT,
  GENDER_VALUES,
  STATUS_VALUES,
} from '@/common/constants/employee.constant';
import { ERole } from '@/common/constants/role.constant';
import { EBenefitType, EBenefitValueType } from '@/common/types/benefit.type';
import { IErrorRow, IPaginationResponse } from '@/common/types/common.type';
import {
  EEmployeeStatus,
  IEmployeeImportRow,
} from '@/common/types/employee.type';
import { EUserStatus, IUser } from '@/common/types/user.type';
import { hashString } from '@/common/utils/crypto.util';
import { readExcelFile } from '@/common/utils/file.util';
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
import { EmployeeBenefitEntity } from '../employee-benefit/entities/employee-benefit.entity';
import { EmploymentHistoryEntity } from '../employee-histories/entities/employment-history.entity';
import { UserEntity } from '../users/entities/user.entity';
import CreateEmployeeDto from './dto/create-employee.dto';
import SearchEmployeeQueryDto from './dto/search-employee-query.dto';
import UpdateEmployeeProfileDto from './dto/update-employee-profile.dto';
import UpdateEmployeeDto from './dto/update-employee.dto';
import { EmployeeEntity } from './entities/employee.entity';
import {
  convertEmployeeDataToObject,
  validateEmployeeImport,
  validateEmployeeImportHeaders,
} from '@/common/utils/employee.util';
import { formatDate } from '@/common/utils/date.util';
import { CHUNK_SIZE } from '@/common/constants/common.constant';
import { generateRandomString } from '@/common/utils/string.util';

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

  async getManagerEmployees(actor: IUser) {
    try {
      const departmentId = actor.employee.departmentId;
      let role: ERole[] = [];

      if (actor.role === ERole.MANAGER) {
        role = [ERole.ADMIN];
      } else if (actor.role === ERole.EMPLOYEE) {
        role = [ERole.MANAGER, ERole.ADMIN];
      }

      const queryBuilder = this.employeeRepository
        .createQueryBuilder('employee')
        .innerJoinAndSelect(
          'employee.user',
          'user',
          'user.role IN (:...roles)',
          {
            roles: role,
          },
        )
        .where('employee.departmentId = :departmentId', { departmentId })
        .andWhere('employee.status = :status', {
          status: EEmployeeStatus.WORKING,
        })
        .select([
          'employee.id',
          'employee.firstName',
          'employee.lastName',
          'employee.status',
          'employee.position',
          'employee.departmentId',
          'user.id',
          'user.email',
          'user.role',
          'user.status',
        ]);

      const employees = await queryBuilder.getMany();

      return employees;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
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

  async importEmployees(file: Express.Multer.File) {
    try {
      const { headers, csvData } = readExcelFile(file);

      const errorsResult: IErrorRow[] = [];

      if (!headers || !validateEmployeeImportHeaders(headers)) {
        throw new BadRequestException('Headers is not valid format');
      }

      const data = convertEmployeeDataToObject(csvData);

      const departments = await this.departmentRepository.find({
        select: {
          id: true,
          name: true,
        },
      });

      const departmentIds = departments.map((department) => department.id);
      const listEmails: string[] = [];

      const listEmployeeInfo: IEmployeeImportRow[] = [];

      for (const [rowIndex, employee] of data.entries()) {
        const errorRow = validateEmployeeImport(employee);

        if (
          employee[EImportEmployeeColumns.DEPARTMENT_ID] &&
          !departmentIds.includes(
            parseInt(employee[EImportEmployeeColumns.DEPARTMENT_ID]),
          )
        ) {
          errorRow.push('Department is not valid');
        }

        const email = employee[EImportEmployeeColumns.EMAIL];

        if (email) {
          if (listEmails.includes(email)) {
            errorRow.push('Email is duplicated');
          }

          const existingEmail = await this.userRepository.findOne({
            where: { email: email },
            select: {
              id: true,
            },
          });

          if (existingEmail) {
            errorRow.push('Email already exists');
          }

          listEmails.push(email);
        }

        if (errorRow.length > 0) {
          errorsResult.push({
            rowIndex: rowIndex + 1,
            errors: errorRow,
          });
        }

        listEmployeeInfo.push({
          firstName: employee[EImportEmployeeColumns.FIRST_NAME],
          lastName: employee[EImportEmployeeColumns.LAST_NAME],
          email: employee[EImportEmployeeColumns.EMAIL],
          departmentId: employee[EImportEmployeeColumns.DEPARTMENT_ID],
          position: employee[EImportEmployeeColumns.POSITION],
          basicSalary: employee[EImportEmployeeColumns.BASIC_SALARY],
          hireDate: formatDate(employee[EImportEmployeeColumns.HIRE_DATE]),
          phone: employee[EImportEmployeeColumns.PHONE],
          address: employee[EImportEmployeeColumns.ADDRESS],
          birthday: formatDate(employee[EImportEmployeeColumns.BIRTHDAY]),
          gender: employee[EImportEmployeeColumns.GENDER],
          status: employee[EImportEmployeeColumns.STATUS],
        });
      }

      if (errorsResult.length > 0) {
        return errorsResult;
      }

      return await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          const transactionResult: any[] = [];
          for (const employee of listEmployeeInfo) {
            const result = await transactionalEntityManager.save(
              EmployeeEntity,
              {
                firstName: employee.firstName,
                lastName: employee.lastName,
                departmentId: Number(employee.departmentId),
                position: employee.position,
                hireDate: employee.hireDate,
                phone: employee.phone?.padStart(10, '0'),
                address: employee.address,
                birthday: employee.birthday,
                gender: GENDER_VALUES[employee.gender || 0],
                status: STATUS_VALUES[employee.status || 0],
              },
            );

            await transactionalEntityManager.save(EmploymentHistoryEntity, {
              employeeId: result.id,
              departmentId: Number(employee.departmentId),
              position: employee.position,
              basicSalary: Number(employee.basicSalary),
              startDate: employee.hireDate,
            });

            const password = generateRandomString(10);

            await transactionalEntityManager.save(UserEntity, {
              email: employee.email,
              displayName: buildDisplayName(
                employee.firstName || '',
                employee.lastName || '',
              ),
              password: await hashString(password),
              role: ERole.EMPLOYEE,
              status:
                result.status === EEmployeeStatus.WORKING
                  ? EUserStatus.ACTIVE
                  : EUserStatus.INACTIVE,
              employeeId: result.id,
            });

            transactionResult.push({
              ...result,
              password: password,
            });
          }

          return transactionResult;
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
