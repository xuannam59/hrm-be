import {
  ALLOWED_SORT_FIELDS_INSURANCE,
  INSURANCE_SELECT,
} from '@/common/constants/insurance.contant';
import { EEmployeeStatus } from '@/common/constants/employee.constant';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { CreateEmployeeInsuranceDto } from './dto/create-employee-insurance.dto';
import { SearchEmployeeInsuranceQueryDto } from './dto/search-employee-insurance-query.dto';
import { UpdateEmployeeInsuranceDto } from './dto/update-employee-insurance.dto';
import { EmployeeInsuranceEntity } from './entities/employee-insurance.entity';
import { IPaginationResponse } from '@/common/types/common.type';

@Injectable()
export class EmployeeInsuranceService {
  constructor(
    @InjectRepository(EmployeeInsuranceEntity)
    private readonly employeeInsuranceRepository: Repository<EmployeeInsuranceEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}
  async create(createEmployeeInsuranceDto: CreateEmployeeInsuranceDto) {
    try {
      const employeeInsurance = this.employeeInsuranceRepository.create({
        employeeId: createEmployeeInsuranceDto.employeeId,
        insuranceType: createEmployeeInsuranceDto.insuranceType,
        insuranceNumber: createEmployeeInsuranceDto.insuranceNumber,
        startDate: createEmployeeInsuranceDto.startDate,
        endDate: createEmployeeInsuranceDto.endDate,
      });

      await this.employeeInsuranceRepository.save(employeeInsurance);

      return employeeInsurance;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }

  async findAll(
    query: SearchEmployeeInsuranceQueryDto,
  ): Promise<IPaginationResponse<EmployeeInsuranceEntity>> {
    try {
      const {
        page,
        limit,
        sortField,
        sortOrder,
        employeeId,
        insuranceType,
        insuranceNumber,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,
      } = query;

      const skip = (page - 1) * limit;
      const safeSortField = ALLOWED_SORT_FIELDS_INSURANCE.includes(sortField)
        ? sortField
        : 'createdAt';

      const queryBuilder = this.employeeInsuranceRepository
        .createQueryBuilder('employeeInsurance')
        .leftJoinAndSelect('employeeInsurance.employee', 'employee')
        .orderBy(`employeeInsurance.${safeSortField}`, sortOrder)
        .skip(skip)
        .take(limit)
        .select(INSURANCE_SELECT);

      if (employeeId) {
        queryBuilder.andWhere('employeeInsurance.employeeId = :employeeId', {
          employeeId,
        });
      }

      if (insuranceType) {
        queryBuilder.andWhere(
          'employeeInsurance.insuranceType = :insuranceType',
          { insuranceType },
        );
      }

      if (insuranceNumber) {
        queryBuilder.andWhere(
          'employeeInsurance.insuranceNumber LIKE :insuranceNumber',
          { insuranceNumber: `%${insuranceNumber}%` },
        );
      }

      if (startDateFrom) {
        queryBuilder.andWhere('employeeInsurance.startDate >= :startDateFrom', {
          startDateFrom: new Date(startDateFrom).setHours(0, 0, 0, 0),
        });
      }

      if (startDateTo) {
        queryBuilder.andWhere('employeeInsurance.startDate <= :startDateTo', {
          startDateTo: new Date(startDateTo).setHours(23, 59, 59, 999),
        });
      }

      if (endDateFrom) {
        queryBuilder.andWhere('employeeInsurance.endDate >= :endDateFrom', {
          endDateFrom: new Date(endDateFrom).setHours(0, 0, 0, 0),
        });
      }

      if (endDateTo) {
        queryBuilder.andWhere('employeeInsurance.endDate <= :endDateTo', {
          endDateTo: new Date(endDateTo).setHours(23, 59, 59, 999),
        });
      }

      const [employeeInsurances, total] = await queryBuilder.getManyAndCount();

      return {
        result: employeeInsurances,
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
        {
          cause: error,
        },
      );
    }
  }

  async findOne(id: number) {
    try {
      const queryBuilder = this.employeeInsuranceRepository
        .createQueryBuilder('employeeInsurance')
        .leftJoinAndSelect('employeeInsurance.employee', 'employee')
        .where('employeeInsurance.id = :id', { id })
        .select(INSURANCE_SELECT);

      const employeeInsurance = await queryBuilder.getOne();

      return employeeInsurance;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }

  async update(
    insuranceId: number,
    updateEmployeeInsuranceDto: UpdateEmployeeInsuranceDto,
  ) {
    try {
      const { insuranceType, insuranceNumber, startDate, endDate } =
        updateEmployeeInsuranceDto;

      await this.employeeInsuranceRepository.update(insuranceId, {
        insuranceType,
        insuranceNumber,
        startDate,
        endDate,
      });

      return 'Updated successfully';
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }

  async remove(insuranceId: number) {
    try {
      await this.employeeInsuranceRepository.softDelete(insuranceId);
      return 'Deleted successfully';
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }
}
