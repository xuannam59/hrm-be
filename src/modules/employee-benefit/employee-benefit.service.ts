import {
  ALLOWED_SORT_FIELDS_BENEFIT,
  BENEFIT_SELECT,
} from '@/common/constants/benefit.constant';
import { EEmployeeStatus } from '@/common/constants/employee.constant';
import { IUser } from '@/common/types/user.type';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, MoreThanOrEqual, Or, Repository } from 'typeorm';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { CreateEmployeeBenefitDto } from './dto/create-employee-benefit.dto';
import { SearchEmployeeBenefitQueryDto } from './dto/search-employee-benefit-query.dto';
import { UpdateEmployeeBenefitDto } from './dto/update-employee-benefit.dto';
import { EmployeeBenefitEntity } from './entities/employee-benefit.entity';

@Injectable()
export class EmployeeBenefitService {
  constructor(
    @InjectRepository(EmployeeBenefitEntity)
    private readonly employeeBenefitRepository: Repository<EmployeeBenefitEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private readonly logger = new Logger(EmployeeBenefitService.name);

  async create(createEmployeeBenefitDto: CreateEmployeeBenefitDto) {
    try {
      const now = new Date();
      const [employeeInfo, employeeBenefit] = await Promise.all([
        this.employeeRepository.findOne({
          where: {
            id: createEmployeeBenefitDto.employeeId,
            status: EEmployeeStatus.WORKING,
          },
        }),
        this.employeeBenefitRepository.findOne({
          where: {
            employeeId: createEmployeeBenefitDto.employeeId,
            benefitType: createEmployeeBenefitDto.benefitType,
            effectiveTo: Or(IsNull(), MoreThanOrEqual(now)),
          },
        }),
      ]);

      if (!employeeInfo) {
        throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      }

      if (
        createEmployeeBenefitDto.effectiveTo &&
        createEmployeeBenefitDto.effectiveTo <
          createEmployeeBenefitDto.effectiveFrom
      ) {
        throw new BadRequestException(
          'Effective to date must be after effective from date',
        );
      }

      return await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          if (employeeBenefit) {
            const closeDate = new Date(createEmployeeBenefitDto.effectiveFrom);
            closeDate.setDate(closeDate.getDate() - 1);

            const effectiveToForOld =
              closeDate < employeeBenefit.effectiveFrom
                ? employeeBenefit.effectiveFrom
                : closeDate;

            await transactionalEntityManager.update(
              EmployeeBenefitEntity,
              { id: employeeBenefit.id },
              {
                effectiveTo: effectiveToForOld,
              },
            );
          }

          const newEmployeeBenefit = transactionalEntityManager.create(
            EmployeeBenefitEntity,
            {
              employeeId: createEmployeeBenefitDto.employeeId,
              benefitType: createEmployeeBenefitDto.benefitType,
              benefitName: createEmployeeBenefitDto.benefitName,
              effectiveFrom: createEmployeeBenefitDto.effectiveFrom,
              effectiveTo: createEmployeeBenefitDto.effectiveTo,
              valueType: createEmployeeBenefitDto.valueType,
              value: createEmployeeBenefitDto.value,
            },
          );

          this.logger.log(
            `Employee benefit created: ${createEmployeeBenefitDto.employeeId} - ${createEmployeeBenefitDto.benefitType}`,
          );

          await transactionalEntityManager.save(newEmployeeBenefit);

          return newEmployeeBenefit;
        },
      );
    } catch (error) {
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

  async findAll(query: SearchEmployeeBenefitQueryDto) {
    try {
      const {
        page,
        limit,
        sortField,
        sortOrder,
        employeeId,
        benefitType,
        effectiveFrom,
        effectiveTo,
      } = query;

      const skip = (page - 1) * limit;
      const safeSortField = ALLOWED_SORT_FIELDS_BENEFIT.includes(sortField)
        ? sortField
        : 'createdAt';

      const queryBuilder = this.employeeBenefitRepository
        .createQueryBuilder('employeeBenefit')
        .leftJoinAndSelect('employeeBenefit.employee', 'employee')
        .skip(skip)
        .take(limit)
        .orderBy(`employeeBenefit.${safeSortField}`, sortOrder)
        .select(BENEFIT_SELECT);

      if (employeeId) {
        queryBuilder.andWhere('employeeBenefit.employeeId = :employeeId', {
          employeeId,
        });
      }

      if (benefitType) {
        queryBuilder.andWhere('employeeBenefit.benefitType = :benefitType', {
          benefitType,
        });
      }

      if (effectiveFrom) {
        queryBuilder.andWhere(
          'employeeBenefit.effectiveFrom >= :effectiveFrom',
          {
            effectiveFrom,
          },
        );
      }

      if (effectiveTo) {
        queryBuilder.andWhere('employeeBenefit.effectiveTo <= :effectiveTo', {
          effectiveTo,
        });
      }

      const [employeeBenefits, total] = await queryBuilder.getManyAndCount();

      return {
        result: employeeBenefits,
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
        {
          cause: error,
        },
      );
    }
  }

  async findOne(benefitId: number) {
    try {
      const queryBuilder = this.employeeBenefitRepository
        .createQueryBuilder('employeeBenefit')
        .leftJoinAndSelect('employeeBenefit.employee', 'employee')
        .where('employeeBenefit.id = :benefitId', { benefitId })
        .select(BENEFIT_SELECT);

      const employeeBenefit = await queryBuilder.getOne();

      if (!employeeBenefit) {
        throw new BadRequestException('Employee benefit not found');
      }

      return employeeBenefit;
    } catch (error) {
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

  async findMy(actor: IUser) {
    try {
      const queryBuilder = this.employeeBenefitRepository
        .createQueryBuilder('employeeBenefit')
        .leftJoinAndSelect('employeeBenefit.employee', 'employee')
        .where('employee.id = :employeeId', { employeeId: actor.employee.id })
        .select(BENEFIT_SELECT);

      const employeeBenefits = await queryBuilder.getMany();

      return employeeBenefits;
    } catch (error) {
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
    benefitId: number,
    updateEmployeeBenefitDto: UpdateEmployeeBenefitDto,
  ) {
    try {
      const { benefitName, effectiveFrom, effectiveTo, valueType, value } =
        updateEmployeeBenefitDto;

      const employeeBenefit = await this.employeeBenefitRepository.findOne({
        where: {
          id: benefitId,
        },
      });

      if (!employeeBenefit) {
        throw new BadRequestException('Employee benefit not found');
      }

      if (
        employeeBenefit.effectiveTo &&
        employeeBenefit.effectiveTo < new Date()
      ) {
        throw new BadRequestException('Employee benefit is expired');
      }

      const effectiveFromDate = effectiveFrom ?? employeeBenefit.effectiveFrom;
      const effectiveToDate = effectiveTo ?? employeeBenefit.effectiveTo;

      if (effectiveToDate && effectiveFromDate > effectiveToDate) {
        throw new BadRequestException(
          'Effective from date must be before effective to date',
        );
      }

      const updatedEmployeeBenefit = this.employeeBenefitRepository.create({
        id: benefitId,
        benefitName,
        effectiveFrom,
        effectiveTo,
        valueType,
        value,
      });

      await this.employeeBenefitRepository.save(updatedEmployeeBenefit);

      return 'update employee benefit success';
    } catch (error) {
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

  async remove(benefitId: number) {
    try {
      const employeeBenefit = await this.employeeBenefitRepository.findOne({
        where: {
          id: benefitId,
        },
      });

      if (!employeeBenefit) {
        throw new BadRequestException('Employee benefit not found');
      }

      await this.employeeBenefitRepository.softDelete(benefitId);

      return 'Employee benefit removed successfully';
    } catch (error) {
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
