import {
  END_WORK_TIME,
  WORK_HOURS,
} from '@/common/constants/attendance.constant';
import { INSURANCE_RATE } from '@/common/constants/insurance.contant';
import {
  ALLOWED_SORT_FIELDS_PAYROLL,
  PAYROLL_SELECT,
} from '@/common/constants/payroll.constant';
import { EBenefitType } from '@/common/types/benefit.type';
import { EEmployeeStatus } from '@/common/types/employee.type';
import { EInsuranceType } from '@/common/types/insurance.type';
import { EPayrollStatus } from '@/common/types/payroll.type';
import { IUser } from '@/common/types/user.type';
import {
  calculateWorkHours,
  getWeekendAndTotalDays,
  isDateActive,
} from '@/common/utils/date.util';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { CalculatePayrollDto } from './dto/calculate-payroll.dto';
import { SearchPayrollQueryDto } from './dto/search-payroll-query.dto';
import { PayrollEntity } from './entities/payroll.entity';
import { CHUNK_SIZE } from '@/common/constants/common.constant';

@Injectable()
export class PayrollsService {
  constructor(
    @InjectRepository(PayrollEntity)
    private readonly payrollRepository: Repository<PayrollEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async calculatePayroll(calculatePayrollDto: CalculatePayrollDto) {
    try {
      const { month, year, employeeIds } = calculatePayrollDto;
      const monthStart = new Date(year, month - 1, 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(year, month, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const queryBuilder = this.employeeRepository
        .createQueryBuilder('employee')
        .leftJoinAndSelect(
          'employee.employmentHistories',
          'employmentHistories',
        )
        .leftJoinAndSelect('employee.insurances', 'insurances')
        .leftJoinAndSelect('employee.benefits', 'benefits')
        .leftJoinAndSelect(
          'employee.attendances',
          'attendances',
          'attendances.workDate BETWEEN :startDate AND :endDate',
          {
            startDate: monthStart,
            endDate: monthEnd,
          },
        )
        .where('employee.status = :status', {
          status: EEmployeeStatus.WORKING,
        })
        .select([
          'employee.id',
          'employee.firstName',
          'employee.lastName',
          'employmentHistories.startDate',
          'employmentHistories.endDate',
          'employmentHistories.basicSalary',
          'insurances.insuranceType',
          'benefits.benefitType',
          'benefits.benefitName',
          'benefits.value',
          'benefits.valueType',
          'benefits.effectiveFrom',
          'benefits.effectiveTo',
          'attendances.workDate',
          'attendances.checkIn',
          'attendances.checkOut',
          'attendances.workHours',
        ]);

      if (employeeIds) {
        queryBuilder.andWhere('employee.id IN (:...employeeIds)', {
          employeeIds,
        });
      }

      const listEmployees = await queryBuilder.getMany();
      const { weekendDays, totalDays } = getWeekendAndTotalDays(year, month);

      if (listEmployees.length === 0) return [];

      const standardWorkingDays = totalDays - weekendDays.length;

      return this.dataSource.transaction(async (transactionalEntityManager) => {
        const listPayrolls: any[] = [];

        const deleteConditions: any = {
          month,
          year,
        };

        if (employeeIds) {
          deleteConditions.employeeId = In(employeeIds);
        }

        await transactionalEntityManager.delete(
          PayrollEntity,
          deleteConditions,
        );

        for (const employee of listEmployees) {
          const currentEmploymentHistory = employee.employmentHistories.find(
            (history) => history.endDate === null,
          );

          const basicSalary = Number(
            currentEmploymentHistory ? currentEmploymentHistory.basicSalary : 0,
          );

          let allowanceValue = 0;
          let bonusValue = 0;
          employee.benefits.forEach((benefit) => {
            const isActive = isDateActive(
              benefit.effectiveFrom,
              benefit.effectiveTo,
            );
            if (benefit.benefitType === EBenefitType.ALLOWANCE && isActive) {
              allowanceValue = Number(benefit.value);
            }

            if (benefit.benefitType === EBenefitType.BONUS && isActive) {
              bonusValue = Number(benefit.value);
            }
          });

          let healthInsuranceValue = 0;
          let socialInsuranceValue = 0;
          employee.insurances.forEach((insurance) => {
            if (insurance.insuranceType === EInsuranceType.HEALTH) {
              healthInsuranceValue = basicSalary * INSURANCE_RATE.HEALTH;
            }
            if (insurance.insuranceType === EInsuranceType.SOCIAL) {
              socialInsuranceValue = basicSalary * INSURANCE_RATE.SOCIAL;
            }
          });

          const workDays = Number(
            (
              employee.attendances.reduce(
                (acc, attendance) =>
                  acc +
                  calculateWorkHours(
                    attendance.checkIn,
                    attendance.checkOut || END_WORK_TIME,
                  ),
                0,
              ) / WORK_HOURS
            ).toFixed(2),
          );

          const grossSalary = basicSalary + allowanceValue + bonusValue;

          const netSalary = Number(
            (
              (grossSalary / standardWorkingDays) * workDays -
              healthInsuranceValue -
              socialInsuranceValue
            ).toFixed(2),
          );

          listPayrolls.push({
            employeeId: employee.id,
            month,
            year,
            basicSalary,
            standardWorkingDays,
            workDays,
            allowanceAmount: allowanceValue,
            bonusAmount: bonusValue,
            grossSalary,
            netSalary: Math.max(netSalary, 0),
            healthInsuranceAmount: healthInsuranceValue,
            socialInsuranceAmount: socialInsuranceValue,
          });
        }

        for (let i = 0; i < listPayrolls.length; i += CHUNK_SIZE) {
          const payrollChunk = listPayrolls.slice(i, i + CHUNK_SIZE);
          await transactionalEntityManager.insert(PayrollEntity, payrollChunk);
        }

        return listPayrolls;
      });
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

  async findAll(query: SearchPayrollQueryDto) {
    try {
      const {
        page,
        limit,
        sortField,
        sortOrder,
        employeeId,
        payrollMonth,
        basicSalary,
        status,
      } = query;

      const skip = (page - 1) * limit;

      const safeSortField = ALLOWED_SORT_FIELDS_PAYROLL.includes(sortField)
        ? sortField
        : 'createdAt';

      const queryBuilder = this.payrollRepository
        .createQueryBuilder('payroll')
        .leftJoinAndSelect('payroll.employee', 'employee')
        .skip(skip)
        .take(limit)
        .orderBy(`payroll.${safeSortField}`, sortOrder)
        .select(PAYROLL_SELECT);

      if (employeeId) {
        queryBuilder.andWhere('payroll.employeeId = :employeeId', {
          employeeId,
        });
      }

      if (payrollMonth) {
        const startDate = new Date(
          payrollMonth.getFullYear(),
          payrollMonth.getMonth(),
          1,
        );
        const endDate = new Date(
          payrollMonth.getFullYear(),
          payrollMonth.getMonth() + 1,
          0,
        );
        queryBuilder.andWhere(
          'payroll.payrollMonth BETWEEN :startDate AND :endDate',
          {
            startDate,
            endDate,
          },
        );
      }

      if (basicSalary) {
        queryBuilder.andWhere('payroll.basicSalary = :basicSalary', {
          basicSalary,
        });
      }

      if (status) {
        queryBuilder.andWhere('payroll.status = :status', { status });
      }

      const [payrolls, total] = await queryBuilder.getManyAndCount();

      return {
        result: payrolls,
        pagination: {
          total,
          page,
          limit,
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

  async findMy(actor: IUser) {
    try {
      const queryBuilder = this.payrollRepository
        .createQueryBuilder('payroll')
        .leftJoinAndSelect('payroll.employee', 'employee')
        .where('employee.id = :employeeId', { employeeId: actor.employee.id })
        .select(PAYROLL_SELECT);

      const payroll = await queryBuilder.getMany();

      return payroll;
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
