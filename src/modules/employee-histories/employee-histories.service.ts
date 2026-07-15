import { IPaginationResponse } from '@/common/types/common.type';
import { IUser } from '@/common/types/user.type';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}
  private readonly logger = new Logger(EmployeeHistoriesService.name);

  async create(createEmployeeHistoryDto: CreateEmployeeHistoryDto) {
    try {
      const [employee, department] = await Promise.all([
        this.employeeRepository.findOne({
          where: { id: createEmployeeHistoryDto.employeeId },
          select: { id: true },
        }),
        this.departmentRepository.findOne({
          where: { id: createEmployeeHistoryDto.departmentId },
          select: { id: true },
        }),
      ]);
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }
      if (!department) {
        throw new NotFoundException('Department not found');
      }

      const employmentHistory = this.employmentHistoryRepository.create({
        employeeId: employee.id,
        departmentId: department.id,
        position: createEmployeeHistoryDto.position,
        startDate: createEmployeeHistoryDto.startDate,
        basicSalary: createEmployeeHistoryDto.basicSalary,
      });
      const savedEmploymentHistory =
        await this.employmentHistoryRepository.save(employmentHistory);
      this.logger.log(
        `Employment history created successfully for employee ${employee.id}`,
      );
      return savedEmploymentHistory;
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
      if (updateEmployeeHistoryDto.departmentId) {
        const department = await this.departmentRepository.findOne({
          where: { id: updateEmployeeHistoryDto.departmentId },
          select: { id: true },
        });
        if (!department) {
          throw new NotFoundException('Department not found');
        }
      }
      const employmentHistory = await this.employmentHistoryRepository.findOne({
        where: { id: employmentHistoryId },
        select: { id: true },
      });

      if (!employmentHistory) {
        throw new NotFoundException('Employment history not found');
      }

      await this.employmentHistoryRepository.update(employmentHistoryId, {
        departmentId: updateEmployeeHistoryDto.departmentId,
        position: updateEmployeeHistoryDto.position,
        startDate: updateEmployeeHistoryDto.startDate,
        endDate: updateEmployeeHistoryDto.endDate,
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
      const employmentHistory = await this.employmentHistoryRepository.findOne({
        where: { id: employmentHistoryId },
        select: { id: true },
      });
      if (!employmentHistory) {
        throw new NotFoundException('Employment history not found');
      }
      await this.employmentHistoryRepository.softDelete(employmentHistoryId);
      this.logger.log(
        `Employment history deleted successfully for employee ${employmentHistory.employeeId}`,
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
