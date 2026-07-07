import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmployeeHistoryDto } from './dto/create-employee-history.dto';
import { UpdateEmployeeHistoryDto } from './dto/update-employee-history.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmploymentHistoryEntity } from './entities/employment-history.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { DepartmentEntity } from '../departments/entities/department.entity';
import SearchHistoryQueryDto from './dto/search-history-query.dto';
import { IPaginationResponse } from '@/common/types/common.type';

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
      });
      const savedEmploymentHistory =
        await this.employmentHistoryRepository.save(employmentHistory);
      this.logger.log(
        `Employment history created successfully for employee ${employee.id}`,
      );
      return savedEmploymentHistory;
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

  async findAll(
    query: SearchHistoryQueryDto,
  ): Promise<IPaginationResponse<EmploymentHistoryEntity>> {
    try {
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        employeeId,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,
      } = query;
      const pageNumber = page ? page : 1;
      const limitNumber = limit ? limit : 10;
      const sortByColumn = sortBy ? sortBy : 'createdAt';
      const orderBy = sortOrder ? sortOrder : 'DESC';
      const skip = (pageNumber - 1) * limitNumber;
      const take = limitNumber;

      const queryBuilder = this.employmentHistoryRepository
        .createQueryBuilder('employmentHistory')
        .leftJoinAndSelect('employmentHistory.employee', 'employee')
        .leftJoinAndSelect('employmentHistory.department', 'department')
        .skip(skip)
        .take(take)
        .orderBy(`employmentHistory.${sortByColumn}`, orderBy)
        .select([
          'employmentHistory.id',
          'employmentHistory.employeeId',
          'employmentHistory.departmentId',
          'employmentHistory.position',
          'employmentHistory.startDate',
          'employmentHistory.endDate',
          'employmentHistory.createdAt',
          'employmentHistory.updatedAt',
          'employee.id',
          'employee.employeeCode',
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
          total: total,
          page: pageNumber,
          limit: limitNumber,
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

  async findOne(employmentHistoryId: number) {
    try {
      const employmentHistory = await this.employmentHistoryRepository.findOne({
        where: { id: employmentHistoryId },
        relations: {
          employee: true,
          department: true,
        },
        select: {
          id: true,
          employee: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            position: true,
          },
          department: {
            id: true,
            name: true,
          },
          position: true,
          startDate: true,
          endDate: true,
        },
      });
      if (!employmentHistory) {
        throw new NotFoundException('Employment history not found');
      }
      return employmentHistory;
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
