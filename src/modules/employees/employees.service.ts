import {
  EBenefitType,
  EBenefitValueType,
} from '@/common/constants/benefit.constant';
import { CHUNK_SIZE } from '@/common/constants/common.constant';
import {
  ALLOWED_SORT_FIELDS_EMPLOYEE,
  EEmployeeStatus,
  EImportEmployeeColumns,
  EMPLOYEE_SELECT,
  EPositionType,
  GENDER_VALUES,
  POSITION_VALUES,
  STATUS_VALUES,
} from '@/common/constants/employee.constant';
import {
  ERole,
  EUserStatus,
  ROLE_VALUES,
} from '@/common/constants/user.constant';
import { IErrorRow, IPaginationResponse } from '@/common/types/common.type';
import { IEmployeeImportRow } from '@/common/types/employee.type';
import { IUser } from '@/common/types/user.type';
import { hashString } from '@/common/utils/crypto.util';
import { formatDate } from '@/common/utils/date.util';
import {
  convertEmployeeDataToObject,
  validateEmployeeImport,
  validateEmployeeImportHeaders,
} from '@/common/utils/employee.util';
import { readExcelFile } from '@/common/utils/file.util';
import { generateRandomString } from '@/common/utils/string.util';
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
import { Brackets, DataSource, In, IsNull, Repository } from 'typeorm';
import { DepartmentEntity } from '../departments/entities/department.entity';
import { EmployeeBenefitEntity } from '../employee-benefit/entities/employee-benefit.entity';
import { EmploymentHistoryEntity } from '../employee-histories/entities/employment-history.entity';
import { UserEntity } from '../users/entities/user.entity';
import CreateEmployeeDto from './dto/create-employee.dto';
import SearchEmployeeQueryDto from './dto/search-employee-query.dto';
import UpdateEmployeeProfileDto from './dto/update-employee-profile.dto';
import UpdateEmployeeDto from './dto/update-employee.dto';
import { EmployeeEntity } from './entities/employee.entity';

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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
      const position = createEmployeeDto.account?.role
        ? EPositionType[createEmployeeDto.account.role]
        : EPositionType[ERole.EMPLOYEE];

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
            position: position,
            departmentId: createEmployeeDto.departmentId,
            status: createEmployeeDto.status,
          });

          await transactionalEntityManager.save(employee);

          const employmentHistory = transactionalEntityManager.create(
            EmploymentHistoryEntity,
            {
              employeeId: employee.id,
              departmentId: createEmployeeDto.departmentId,
              position: position,
              startDate: createEmployeeDto.hireDate,
              basicSalary: createEmployeeDto.basicSalary,
            },
          );

          const employeeBenefit = transactionalEntityManager.create(
            EmployeeBenefitEntity,
            {
              employeeId: employee.id,
              benefitType: EBenefitType.ANNUAL_LEAVE,
              benefitName: 'Annual Leave',
              valueType: EBenefitValueType.DAY,
              value: 1.0,
              effectiveFrom: createEmployeeDto.hireDate,
            },
          );

          await Promise.all([
            transactionalEntityManager.save(employmentHistory),
            transactionalEntityManager.save(employeeBenefit),
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
    } catch (error: any) {
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
        this.userRepository.exists({
          where: { email: provisionAccountDto.email },
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
    } catch (error: any) {
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
      const { hireDate, position, status, departmentId, basicSalary } =
        updateEmployeeDto;
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
          await transactionalEntityManager.update(EmployeeEntity, employeeId, {
            hireDate,
            position,
            status,
            departmentId,
          });

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
    } catch (error: any) {
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
    } catch (error: any) {
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

      const departmentIdSet = new Set(
        departments.map((department) => department.id),
      );

      const listEmployeeInfo: IEmployeeImportRow[] = [];

      const emails = data
        .map((e) => e[EImportEmployeeColumns.EMAIL])
        .filter(Boolean);

      const existingEmailSet = new Set<string>();

      if (emails.length > 0) {
        const existingEmails = await this.userRepository.find({
          where: { email: In(emails) },
          select: { email: true },
        });

        existingEmails.forEach((e) => existingEmailSet.add(e.email));
      }

      const seenEmails = new Set<string>();

      for (const [rowIndex, employee] of data.entries()) {
        const errorRow = validateEmployeeImport(employee);

        if (
          employee[EImportEmployeeColumns.DEPARTMENT_ID] &&
          !departmentIdSet.has(employee[EImportEmployeeColumns.DEPARTMENT_ID])
        ) {
          errorRow.push('Department is not valid');
        }

        const email = employee[EImportEmployeeColumns.EMAIL];

        if (email) {
          if (seenEmails.has(email)) {
            errorRow.push('Email is duplicated in the file');
          } else if (existingEmailSet.has(email)) {
            errorRow.push('Email already exists in the system');
          }

          seenEmails.add(email);
        }

        if (errorRow.length > 0) {
          errorsResult.push({
            rowIndex: rowIndex + 1,
            errors: errorRow,
          });
          continue;
        }

        listEmployeeInfo.push({
          firstName: employee[EImportEmployeeColumns.FIRST_NAME],
          lastName: employee[EImportEmployeeColumns.LAST_NAME],
          email: employee[EImportEmployeeColumns.EMAIL],
          departmentId: employee[EImportEmployeeColumns.DEPARTMENT_ID],
          role: employee[EImportEmployeeColumns.ROLE],
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

      const imported: any[] = [];
      const failedChunks: any[] = [];

      for (let i = 0; i < listEmployeeInfo.length; i += CHUNK_SIZE) {
        try {
          const chunk = listEmployeeInfo.slice(i, i + CHUNK_SIZE);

          const chunkResult = await this.dataSource.transaction(
            async (transactionalEntityManager) => {
              const credentials = await Promise.all(
                chunk.map(async () => {
                  const password = generateRandomString(10);
                  return { password, hashed: await hashString(password) };
                }),
              );

              const employees = await transactionalEntityManager.save(
                EmployeeEntity,
                chunk.map((emp) => ({
                  firstName: emp.firstName,
                  lastName: emp.lastName,
                  departmentId: emp.departmentId,
                  position: POSITION_VALUES[emp.role || 0],
                  hireDate: emp.hireDate,
                  phone: emp.phone?.padStart(10, '0'),
                  address: emp.address,
                  birthday: emp.birthday,
                  gender: GENDER_VALUES[emp.gender],
                  status: STATUS_VALUES[emp.status],
                })),
              );

              await transactionalEntityManager.save(
                EmploymentHistoryEntity,
                employees.map((emp, idx) => ({
                  employeeId: emp.id,
                  departmentId: Number(emp.departmentId),
                  position: emp.position,
                  basicSalary: Number(chunk[idx].basicSalary) || 0,
                  startDate: emp.hireDate,
                })),
              );

              await transactionalEntityManager.save(
                EmployeeBenefitEntity,
                employees.map((emp) => ({
                  employeeId: emp.id,
                  benefitType: EBenefitType.ANNUAL_LEAVE,
                  benefitName: 'Annual Leave',
                  valueType: EBenefitValueType.DAY,
                  value: 1.0,
                  effectiveFrom: emp.hireDate,
                })),
              );

              await transactionalEntityManager.save(
                UserEntity,
                employees.map((emp, idx) => ({
                  email: chunk[idx].email,
                  displayName: buildDisplayName(
                    emp.firstName || '',
                    emp.lastName || '',
                  ),
                  password: credentials[idx].hashed,
                  role: ERole[ROLE_VALUES[chunk[idx].role]],
                  status:
                    emp.status === EEmployeeStatus.WORKING
                      ? EUserStatus.ACTIVE
                      : EUserStatus.INACTIVE,
                  employeeId: emp.id,
                })),
              );

              return employees.map((emp, idx) => ({
                ...emp,
                password: credentials[idx].password,
                email: chunk[idx].email,
              }));
            },
          );
          imported.push(...chunkResult);
        } catch (error: any) {
          failedChunks.push({
            from: i + 1,
            to: i + CHUNK_SIZE,
            error: error.message,
          });
          continue;
        }
      }

      return { imported, failedChunks };
    } catch (error: any) {
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
