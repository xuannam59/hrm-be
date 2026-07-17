import {
  END_WORK_TIME,
  START_WORK_TIME,
  WORK_HOURS,
} from '@/common/constants/attendance.constant';
import { EAttendanceStatus } from '@/common/constants/attendance.constant';
import { EBenefitType } from '@/common/constants/benefit.constant';
import { IPaginationResponse } from '@/common/types/common.type';
import { EEmployeeStatus } from '@/common/constants/employee.constant';
import {
  ELeaveRequestStatus,
  ELeaveType,
} from '@/common/constants/leave-request.constant';
import { ERole, EUserStatus } from '@/common/constants/user.constant';
import { IUser } from '@/common/types/user.type';
import {
  getEarliestLeaveRequestDate,
  getNumberOfLeaveDays,
} from '@/common/utils/date.util';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  DataSource,
  IsNull,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { AttendanceEntity } from '../attendance/entities/attendance.entity';
import { EmployeeBenefitEntity } from '../employee-benefit/entities/employee-benefit.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import {
  SearchLeaveQueryDto,
  SearchMyLeaveQueryDto,
} from './dto/search-leave-query.dto';
import {
  UpdateLeaveRequestStatusDto,
  UpdateMyLeaveRequestDto,
} from './dto/update-leave-request.dto';
import { LeaveRequestEntity } from './entities/leave-request.entity';

@Injectable()
export class LeaveRequestsService {
  constructor(
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepository: Repository<LeaveRequestEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(EmployeeBenefitEntity)
    private readonly employeeBenefitRepository: Repository<EmployeeBenefitEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createLeaveRequestDto: CreateLeaveRequestDto, actor: IUser) {
    try {
      const { approverId, startDate, endDate, leaveType, reason } =
        createLeaveRequestDto;

      const approverInfo = await this.employeeRepository.findOne({
        where: {
          id: approverId,
          status: EEmployeeStatus.WORKING,
          user: {
            status: EUserStatus.ACTIVE,
            role: Not(ERole.EMPLOYEE),
          },
        },
        relations: {
          user: true,
        },
        select: {
          id: true,
          departmentId: true,
          status: true,
          user: {
            id: true,
            role: true,
            status: true,
          },
        },
      });

      if (!approverInfo) {
        throw new NotFoundException('Approver not found');
      }

      if (
        actor.role === ERole.EMPLOYEE &&
        actor.employee.departmentId !== approverInfo.departmentId
      ) {
        throw new BadRequestException('Approver is not in the same department');
      }

      const approverRole = approverInfo.user.role;
      const isAdminApprover = approverRole === ERole.ADMIN;

      if (actor.role === ERole.MANAGER && !isAdminApprover) {
        throw new BadRequestException(
          'Managers must submit leave requests to an admin',
        );
      }

      if (approverId === actor.employee.id) {
        throw new BadRequestException(
          'Cannot submit a leave request to yourself',
        );
      }

      const requestStart = new Date(startDate);
      const requestEnd = new Date(endDate);
      requestStart.setHours(0, 0, 0, 0);
      requestEnd.setHours(23, 59, 59, 999);
      const earliestLeaveRequestDate = getEarliestLeaveRequestDate();
      if (requestStart < earliestLeaveRequestDate) {
        throw new BadRequestException(
          'Start date cannot be more than 7 days in the past',
        );
      }

      if (requestStart.getTime() > requestEnd.getTime()) {
        throw new BadRequestException(
          'Start date must be before or equal to end date',
        );
      }

      const overlappingRequest = await this.leaveRequestRepository
        .createQueryBuilder('leaveRequest')
        .where('leaveRequest.employeeId = :employeeId', {
          employeeId: actor.employee.id,
        })
        .andWhere('leaveRequest.status IN (:...statuses)', {
          statuses: [ELeaveRequestStatus.PENDING, ELeaveRequestStatus.APPROVED],
        })
        .andWhere('leaveRequest.startDate <= :endDate', { endDate })
        .andWhere('leaveRequest.endDate >= :startDate', { startDate })
        .getOne();

      if (overlappingRequest) {
        throw new BadRequestException(
          'Leave request overlaps with an existing request',
        );
      }

      const numberOfDays = getNumberOfLeaveDays(startDate, endDate);

      const leaveRequest = this.leaveRequestRepository.create({
        approverId,
        startDate: requestStart,
        endDate: requestEnd,
        leaveType,
        reason,
        employeeId: actor.employee.id,
        numberOfDays,
      });
      const savedLeaveRequest =
        await this.leaveRequestRepository.save(leaveRequest);

      return savedLeaveRequest;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message ?? 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }

  async findAll(
    query: SearchLeaveQueryDto,
    actor: IUser,
  ): Promise<IPaginationResponse<LeaveRequestEntity>> {
    try {
      const {
        page,
        limit,
        sortField,
        sortOrder,
        from,
        to,
        employeeId,
        leaveType,
        status,
      } = query;

      const skip = (page - 1) * limit;

      const queryBuilder = this.leaveRequestRepository
        .createQueryBuilder('leaveRequest')
        .leftJoinAndSelect('leaveRequest.employee', 'employee')
        .leftJoinAndSelect('leaveRequest.approver', 'approver')
        .where('leaveRequest.approverId = :approverId', {
          approverId: actor.employee.id,
        })
        .skip(skip)
        .take(limit)
        .orderBy(`leaveRequest.${sortField}`, sortOrder)
        .select([
          'leaveRequest.id',
          'leaveRequest.startDate',
          'leaveRequest.endDate',
          'leaveRequest.leaveType',
          'leaveRequest.status',
          'leaveRequest.approverId',
          'leaveRequest.numberOfDays',
          'leaveRequest.createdAt',
          'leaveRequest.updatedAt',
          'employee.id',
          'employee.firstName',
          'employee.lastName',
          'approver.id',
          'approver.firstName',
          'approver.lastName',
        ]);

      if (from) {
        queryBuilder.andWhere('leaveRequest.startDate >= :from', {
          from: new Date(from).setHours(0, 0, 0, 0),
        });
      }

      if (to) {
        queryBuilder.andWhere('leaveRequest.startDate <= :to', {
          to: new Date(to).setHours(23, 59, 59, 999),
        });
      }

      if (employeeId) {
        queryBuilder.andWhere('leaveRequest.employeeId = :employeeId', {
          employeeId,
        });
      }

      if (leaveType) {
        queryBuilder.andWhere('leaveRequest.leaveType = :leaveType', {
          leaveType,
        });
      }

      if (status) {
        queryBuilder.andWhere('leaveRequest.status = :status', {
          status,
        });
      }

      const [leaveRequests, total] = await queryBuilder.getManyAndCount();
      return {
        result: leaveRequests,
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

  async getMyLeaveRequests(
    searchLeaveQueryDto: SearchMyLeaveQueryDto,
    actor: IUser,
  ) {
    try {
      const { page, limit, sortField, sortOrder, from, to, leaveType, status } =
        searchLeaveQueryDto;
      const skip = (page - 1) * limit;

      const queryBuilder = this.leaveRequestRepository
        .createQueryBuilder('leaveRequest')
        .leftJoinAndSelect('leaveRequest.approver', 'approver')
        .where('leaveRequest.employeeId = :employeeId', {
          employeeId: actor.employee.id,
        })
        .skip(skip)
        .take(limit)
        .orderBy(`leaveRequest.${sortField}`, sortOrder)
        .select([
          'leaveRequest.id',
          'leaveRequest.numberOfDays',
          'leaveRequest.startDate',
          'leaveRequest.endDate',
          'leaveRequest.leaveType',
          'leaveRequest.status',
          'leaveRequest.approverId',
          'leaveRequest.reason',
          'leaveRequest.note',
          'leaveRequest.createdAt',
          'leaveRequest.updatedAt',
          'approver.id',
          'approver.firstName',
          'approver.lastName',
        ]);

      if (from) {
        queryBuilder.andWhere('leaveRequest.startDate >= :from', {
          from: new Date(from).setHours(0, 0, 0, 0),
        });
      }

      if (to) {
        queryBuilder.andWhere('leaveRequest.endDate <= :to', {
          to: new Date(to).setHours(23, 59, 59, 999),
        });
      }

      if (leaveType) {
        queryBuilder.andWhere('leaveRequest.leaveType = :leaveType', {
          leaveType,
        });
      }

      if (status) {
        queryBuilder.andWhere('leaveRequest.status = :status', {
          status,
        });
      }

      const [leaveRequests, total] = await queryBuilder.getManyAndCount();
      return {
        result: leaveRequests,
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

  async findOne(id: number, actor: IUser) {
    try {
      const queryBuilder = this.leaveRequestRepository
        .createQueryBuilder('leaveRequest')
        .leftJoinAndSelect('leaveRequest.employee', 'employee')
        .where('leaveRequest.id = :id', { id })
        .andWhere(
          new Brackets((qb) => {
            qb.where('leaveRequest.employeeId = :employeeId', {
              employeeId: actor.employee.id,
            }).orWhere('leaveRequest.approverId = :approverId', {
              approverId: actor.employee.id,
              status: ELeaveRequestStatus.PENDING,
            });
          }),
        )
        .select([
          'leaveRequest.id',
          'leaveRequest.startDate',
          'leaveRequest.endDate',
          'leaveRequest.leaveType',
          'leaveRequest.status',
          'leaveRequest.approverId',
          'leaveRequest.createdAt',
          'leaveRequest.updatedAt',
          'employee.id',
          'employee.firstName',
          'employee.lastName',
        ]);
      const leaveRequest = await queryBuilder.getOne();
      if (!leaveRequest) {
        throw new NotFoundException('Leave request not found');
      }
      return leaveRequest;
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

  async updateMyRequest(
    id: number,
    updateLeaveRequestDto: UpdateMyLeaveRequestDto,
    actor: IUser,
  ) {
    try {
      const { startDate, endDate, leaveType, reason } = updateLeaveRequestDto;

      const leaveRequest = await this.leaveRequestRepository.findOne({
        where: {
          id,
          status: ELeaveRequestStatus.PENDING,
          employeeId: actor.employee.id,
        },
      });
      if (!leaveRequest) {
        throw new NotFoundException('Leave request not found');
      }

      const requestStart = new Date(startDate || leaveRequest.startDate);
      const requestEnd = new Date(endDate || leaveRequest.endDate);
      requestStart.setHours(0, 0, 0, 0);
      requestEnd.setHours(23, 59, 59, 999);
      if (requestStart < getEarliestLeaveRequestDate()) {
        throw new BadRequestException(
          'Start date cannot be more than 7 days in the past',
        );
      }

      if (requestStart.getTime() > requestEnd.getTime()) {
        throw new BadRequestException(
          'Start date must be before or equal to end date',
        );
      }

      const overlappingRequest = await this.leaveRequestRepository
        .createQueryBuilder('leaveRequest')
        .where('leaveRequest.employeeId = :employeeId', {
          employeeId: actor.employee.id,
        })
        .andWhere('leaveRequest.status IN (:...statuses)', {
          statuses: [ELeaveRequestStatus.PENDING, ELeaveRequestStatus.APPROVED],
        })
        .andWhere('leaveRequest.startDate <= :endDate', { endDate })
        .andWhere('leaveRequest.endDate >= :startDate', { startDate })
        .andWhere('leaveRequest.id != :id', { id })
        .getOne();

      if (overlappingRequest) {
        throw new BadRequestException(
          'Leave request overlaps with an existing request',
        );
      }

      const numberOfDays = getNumberOfLeaveDays(requestStart, requestEnd);

      await this.leaveRequestRepository.update(id, {
        startDate: requestStart,
        endDate: requestEnd,
        numberOfDays,
        leaveType,
        reason,
      });
      return 'updated successfully';
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

  async updateStatus(
    id: number,
    updateLeaveRequestDto: UpdateLeaveRequestStatusDto,
    actor: IUser,
  ) {
    try {
      const { status, note } = updateLeaveRequestDto;

      const leaveRequest = await this.leaveRequestRepository.findOne({
        where: { id, status: ELeaveRequestStatus.PENDING },
      });
      if (!leaveRequest) {
        throw new NotFoundException('Leave request not found');
      }

      if (leaveRequest.approverId !== actor.employee.id) {
        throw new ForbiddenException('You are not authorized');
      }

      await this.dataSource.transaction(async (transactionalEntityManager) => {
        const isLeaveTypeValid = [
          ELeaveType.ANNUAL_LEAVE,
          ELeaveType.WORK_FROM_HOME,
        ].includes(leaveRequest.leaveType);

        if (status === ELeaveRequestStatus.APPROVED && isLeaveTypeValid) {
          let attendanceStatus = EAttendanceStatus.ABSENT;

          if (leaveRequest.leaveType === ELeaveType.ANNUAL_LEAVE) {
            attendanceStatus = EAttendanceStatus.ABSENT;

            await transactionalEntityManager.decrement(
              EmployeeBenefitEntity,
              {
                employeeId: leaveRequest.employeeId,
                benefitType: EBenefitType.ANNUAL_LEAVE,
                effectiveTo: IsNull() || MoreThanOrEqual(new Date()),
              },
              'value',
              leaveRequest.numberOfDays,
            );
          } else if (leaveRequest.leaveType === ELeaveType.WORK_FROM_HOME) {
            attendanceStatus = EAttendanceStatus.WORK_FROM_HOME;
          }

          const requestStart = new Date(leaveRequest.startDate);
          requestStart.setHours(0, 0, 0, 0);
          const y = requestStart.getFullYear();
          const m = requestStart.getMonth();
          const d = requestStart.getDate();

          const workDates = Array.from(
            { length: leaveRequest.numberOfDays },
            (_, i) => new Date(y, m, d + i),
          );

          for (const workDate of workDates) {
            const existingAttendance = await transactionalEntityManager.findOne(
              AttendanceEntity,
              {
                where: {
                  employeeId: leaveRequest.employeeId,
                  workDate,
                },
                select: {
                  id: true,
                },
              },
            );

            if (!existingAttendance) {
              await transactionalEntityManager.insert(AttendanceEntity, {
                employeeId: leaveRequest.employeeId,
                workDate,
                checkIn: START_WORK_TIME,
                checkOut: END_WORK_TIME,
                workHours: WORK_HOURS,
                status: attendanceStatus,
              });
            } else {
              await transactionalEntityManager.update(
                AttendanceEntity,
                existingAttendance.id,
                {
                  checkIn: START_WORK_TIME,
                  checkOut: END_WORK_TIME,
                  workHours: WORK_HOURS,
                },
              );
            }
          }
        }

        await transactionalEntityManager.update(LeaveRequestEntity, id, {
          status,
          note,
        });
      });
      return 'updated successfully';
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

  async remove(id: number, actor: IUser) {
    try {
      const leaveRequest = await this.leaveRequestRepository.findOne({
        where: {
          id,
          employeeId: actor.employee.id,
          status: ELeaveRequestStatus.PENDING,
        },
      });

      if (!leaveRequest) {
        throw new NotFoundException('Leave request not found');
      }

      await this.leaveRequestRepository.delete(leaveRequest.id);
      return 'deleted successfully';
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
