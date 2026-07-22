import { IPaginationResponse } from '@/common/types/common.type';
import { IUser } from '@/common/types/user.type';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DepartmentEntity } from '../departments/entities/department.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { CreateEmployeeHistoryDto } from './dto/create-employee-history.dto';
import SearchHistoryQueryDto from './dto/search-history-query.dto';
import { UpdateEmployeeHistoryDto } from './dto/update-employee-history.dto';
import { EmploymentHistoryEntity } from './entities/employment-history.entity';

@Injectable()
export class EmployeeHistoriesService {
  constructor(
    @InjectRepository(EmploymentHistoryEntity)
    private readonly employmentHistoryRepository: Repository<EmploymentHistoryEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
    private readonly dataSource: DataSource,
  ) {}
  private readonly logger = new Logger(EmployeeHistoriesService.name);

  async create(createEmployeeHistoryDto: CreateEmployeeHistoryDto) {
    try {
      if (
        createEmployeeHistoryDto.startDate &&
        createEmployeeHistoryDto.endDate &&
        createEmployeeHistoryDto.startDate > createEmployeeHistoryDto.endDate
      ) {
        throw new BadRequestException('Start date must be before end date');
      }

      const existingEmploymentHistory = await this.employmentHistoryRepository
        .createQueryBuilder('employmentHistory')
        .where('employmentHistory.employeeId = :employeeId', {
          employeeId: createEmployeeHistoryDto.employeeId,
        })
        .select([
          'employmentHistory.id',
          'employmentHistory.endDate',
          'employmentHistory.startDate',
        ])
        .orderBy('employmentHistory.id', 'DESC')
        .getOne();

      if (existingEmploymentHistory) {
        const newStart = new Date(createEmployeeHistoryDto.startDate);
        const existStart = new Date(existingEmploymentHistory.startDate);
        const existEnd = existingEmploymentHistory.endDate
          ? new Date(existingEmploymentHistory.endDate)
          : null;

        const isOverlap = existEnd
          ? existEnd > newStart
          : newStart < existStart;

        if (isOverlap) {
          throw new BadRequestException(
            'Employment history overlaps with an existing employment history',
          );
        }
      }

      return this.dataSource.transaction(async (transactionalEntityManager) => {
        if (existingEmploymentHistory) {
          await transactionalEntityManager.update(
            EmploymentHistoryEntity,
            { id: existingEmploymentHistory.id },
            { endDate: createEmployeeHistoryDto.startDate },
          );
        }

        const employmentHistory = transactionalEntityManager.create(
          EmploymentHistoryEntity,
          {
            employeeId: createEmployeeHistoryDto.employeeId,
            departmentId: createEmployeeHistoryDto.departmentId,
            position: createEmployeeHistoryDto.position,
            startDate: createEmployeeHistoryDto.startDate,
            endDate: createEmployeeHistoryDto.endDate ?? null,
            basicSalary: createEmployeeHistoryDto.basicSalary,
          },
        );

        this.logger.log(
          `Employment history created successfully for employee ${createEmployeeHistoryDto.employeeId}`,
        );
        return transactionalEntityManager.save(employmentHistory);
      });
    } catch (error: any) {
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

  async findAll(
    query: SearchHistoryQueryDto,
  ): Promise<IPaginationResponse<EmploymentHistoryEntity>> {
    try {
      const {
        page,
        limit,
        sortField,
        sortOrder,
        search,
        employeeId,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,
        departmentId,
      } = query;

      const skip = (page - 1) * limit;

      const queryBuilder = this.employmentHistoryRepository
        .createQueryBuilder('employmentHistory')
        .leftJoinAndSelect('employmentHistory.employee', 'employee')
        .leftJoinAndSelect('employmentHistory.department', 'department')
        .skip(skip)
        .take(limit)
        .orderBy(`employmentHistory.${sortField}`, sortOrder)
        .select([
          'employmentHistory.id',
          'employmentHistory.employeeId',
          'employmentHistory.departmentId',
          'employmentHistory.position',
          'employmentHistory.startDate',
          'employmentHistory.endDate',
          'employmentHistory.basicSalary',
          'employmentHistory.createdAt',
          'employmentHistory.updatedAt',
          'employee.id',
          'employee.position',
          'employee.firstName',
          'employee.lastName',
          'department.id',
          'department.name',
        ]);

      if (search) {
        queryBuilder.andWhere(
          'employee.firstName LIKE :search OR employee.lastName LIKE :search',
          {
            search: `%${search}%`,
          },
        );
      }

      if (departmentId) {
        queryBuilder.andWhere(
          'employmentHistory.departmentId = :departmentId',
          {
            departmentId,
          },
        );
      }

      if (employeeId) {
        queryBuilder.andWhere('employmentHistory.employeeId = :employeeId', {
          employeeId,
        });
      }

      if (startDateFrom) {
        queryBuilder.andWhere('employmentHistory.startDate >= :startFrom', {
          startFrom: new Date(startDateFrom.setHours(0, 0, 0, 0)),
        });
      }

      if (startDateTo) {
        queryBuilder.andWhere('employmentHistory.startDate <= :startTo', {
          startTo: new Date(startDateTo.setHours(23, 59, 59, 999)),
        });
      }

      if (endDateFrom) {
        queryBuilder.andWhere('employmentHistory.endDate >= :endFrom', {
          endFrom: new Date(endDateFrom.setHours(0, 0, 0, 0)),
        });
      }

      if (endDateTo) {
        queryBuilder.andWhere('employmentHistory.endDate <= :endTo', {
          endTo: new Date(endDateTo.setHours(23, 59, 59, 999)),
        });
      }

      const [employmentHistories, total] = await queryBuilder.getManyAndCount();
      return {
        result: employmentHistories,
        pagination: {
          total,
          page,
          limit,
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

  async findOne(employmentHistoryId: number) {
    try {
      const queryBuilder = this.employmentHistoryRepository
        .createQueryBuilder('employmentHistory')
        .leftJoinAndSelect('employmentHistory.employee', 'employee')
        .leftJoinAndSelect('employmentHistory.department', 'department')
        .where('employmentHistory.id = :id', { id: employmentHistoryId })
        .select([
          'employmentHistory.id',
          'employmentHistory.employeeId',
          'employmentHistory.departmentId',
          'employmentHistory.position',
          'employmentHistory.startDate',
          'employmentHistory.endDate',
          'employmentHistory.basicSalary',
          'employee.id',
          'employee.firstName',
          'employee.lastName',
          'employee.position',
          'department.id',
          'department.name',
        ]);

      const employmentHistory = await queryBuilder.getOne();

      if (!employmentHistory) {
        throw new NotFoundException('Employment history not found');
      }

      return employmentHistory;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message ?? 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async getMyHistories(actor: IUser) {
    try {
      const employmentHistories = await this.employmentHistoryRepository.find({
        where: { employeeId: actor.employee.id },
      });
      return employmentHistories;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message ?? 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async update(
    employmentHistoryId: number,
    updateEmployeeHistoryDto: UpdateEmployeeHistoryDto,
  ) {
    try {
      if (
        updateEmployeeHistoryDto.startDate &&
        updateEmployeeHistoryDto.endDate &&
        updateEmployeeHistoryDto.startDate > updateEmployeeHistoryDto.endDate
      ) {
        throw new BadRequestException('Start date must be before end date');
      }

      const employmentHistory = await this.employmentHistoryRepository.findOne({
        where: { id: employmentHistoryId },
        select: { id: true, endDate: true, startDate: true },
      });

      if (!employmentHistory) {
        throw new NotFoundException('Employment history not found');
      }

      await this.employmentHistoryRepository.update(employmentHistoryId, {
        departmentId: updateEmployeeHistoryDto.departmentId,
        position: updateEmployeeHistoryDto.position,
        startDate: updateEmployeeHistoryDto.startDate,
        endDate: updateEmployeeHistoryDto.endDate ?? null,
      });

      this.logger.log(
        `Employment history updated successfully for employee ${employmentHistory.employeeId}`,
      );
      return 'Employment history updated successfully';
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message ?? 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async remove(employmentHistoryId: number) {
    try {
      await this.employmentHistoryRepository.delete(employmentHistoryId);
      this.logger.log(
        `Employment history deleted successfully for employee ${employmentHistoryId}`,
      );
      return 'Employment history deleted successfully';
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message ?? 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
