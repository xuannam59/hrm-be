import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import {
  UpdateLeaveRequestStatusDto,
  UpdateMyLeaveRequestDto,
} from './dto/update-leave-request.dto';
import { IUser } from '@/common/types/user.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Not, Repository } from 'typeorm';
import { LeaveRequestEntity } from './entities/leave-request.entity';
import {
  SearchLeaveQueryDto,
  SearchMyLeaveQueryDto,
} from './dto/search-leave-query.dto';
import { IPaginationResponse } from '@/common/types/common.type';
import { requireEmployee } from '@/common/utils/user-context.util';
import {
  getEarliestLeaveRequestDate,
  getNumberOfLeaveDays,
} from '@/common/utils/date.util';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { ERole } from '@/common/constants/role.constant';
import { EUserStatus } from '@/common/types/user.type';
import { EEmployeeStatus } from '@/common/types/employee.type';
import {
  ELeaveRequestStatus,
  ELeaveType,
} from '@/common/types/leave-request.type';
import { AttendanceEntity } from '../attendance/entities/attendance.entity';
import { EAttendanceStatus } from '@/common/types/attendance.type';
import {
  END_WORK_TIME,
  WORK_HOURS,
} from '@/common/constants/attendance.constant';
import { START_WORK_TIME } from '@/common/constants/attendance.constant';

@Injectable()
export class LeaveRequestsService {
  constructor(
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepository: Repository<LeaveRequestEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createLeaveRequestDto: CreateLeaveRequestDto, actor: IUser) {
    try {
      const employeeInfo = requireEmployee(actor);
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

      if (employeeInfo.departmentId !== approverInfo.departmentId) {
        throw new BadRequestException('Not in the same department');
      }

      const approverRole = approverInfo.user.role;
      const isAdminApprover = approverRole === ERole.ADMIN;

      if (actor.role === ERole.MANAGER && !isAdminApprover) {
        throw new BadRequestException(
          'Managers must submit leave requests to an admin',
        );
      }

      if (approverId === employeeInfo.id) {
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
          employeeId: employeeInfo.id,
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
        employeeId: employeeInfo.id,
        numberOfDays,
      });
      const savedLeaveRequest =
        await this.leaveRequestRepository.save(leaveRequest);

      return savedLeaveRequest;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }

  async findAll(
    searchLeaveQueryDto: SearchLeaveQueryDto,
    actor: IUser,
  ): Promise<IPaginationResponse<LeaveRequestEntity>> {
    try {
      const employeeInfo = requireEmployee(actor);
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        from,
        to,
        employeeId,
        leaveType,
        status,
      } = searchLeaveQueryDto;
      const pageNumber = page ? page : 1;
      const limitNumber = limit ? limit : 10;
      const sortByColumn = sortBy ? sortBy : 'createdAt';
      const orderBy = sortOrder ? sortOrder : 'DESC';
      const skip = (pageNumber - 1) * limitNumber;
      const take = limitNumber;

      const queryBuilder = this.leaveRequestRepository
        .createQueryBuilder('leaveRequest')
        .leftJoinAndSelect('leaveRequest.employee', 'employee')
        .where('leaveRequest.approverId = :approverId', {
          approverId: employeeInfo.id,
        })
        .skip(skip)
        .take(take)
        .orderBy(`leaveRequest.${sortByColumn}`, orderBy)
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
      const { page, limit, sortBy, sortOrder, from, to, leaveType, status } =
        searchLeaveQueryDto;
      const pageNumber = page ? page : 1;
      const limitNumber = limit ? limit : 10;
      const sortByColumn = sortBy ? sortBy : 'createdAt';
      const orderBy = sortOrder ? sortOrder : 'DESC';
      const skip = (pageNumber - 1) * limitNumber;
      const take = limitNumber;

      const employeeInfo = requireEmployee(actor);
      const queryBuilder = this.leaveRequestRepository
        .createQueryBuilder('leaveRequest')
        .where('leaveRequest.employeeId = :employeeId', {
          employeeId: employeeInfo.id,
        })
        .skip(skip)
        .take(take)
        .orderBy(`leaveRequest.${sortByColumn}`, orderBy)
        .select([
          'leaveRequest.id',
          'leaveRequest.numberOfDays',
          'leaveRequest.startDate',
          'leaveRequest.endDate',
          'leaveRequest.leaveType',
          'leaveRequest.status',
          'leaveRequest.approverId',
          'leaveRequest.createdAt',
          'leaveRequest.updatedAt',
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
        {
          cause: error,
        },
      );
    }
  }

  async findOne(id: number, actor: IUser) {
    try {
      const employeeInfo = requireEmployee(actor);
      const queryBuilder = this.leaveRequestRepository
        .createQueryBuilder('leaveRequest')
        .leftJoinAndSelect('leaveRequest.employee', 'employee')
        .where('leaveRequest.id = :id', { id })
        .andWhere(
          new Brackets((qb) => {
            qb.where('leaveRequest.employeeId = :employeeId', {
              employeeId: employeeInfo.id,
            }).orWhere('leaveRequest.approverId = :approverId', {
              approverId: employeeInfo.id,
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
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
      const employeeInfo = requireEmployee(actor);
      const { startDate, endDate, leaveType, reason } = updateLeaveRequestDto;

      const leaveRequest = await this.leaveRequestRepository.findOne({
        where: {
          id,
          status: ELeaveRequestStatus.PENDING,
          employeeId: employeeInfo.id,
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
          employeeId: employeeInfo.id,
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
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
      const employeeInfo = requireEmployee(actor);
      const { status, note } = updateLeaveRequestDto;

      const leaveRequest = await this.leaveRequestRepository.findOne({
        where: { id, status: ELeaveRequestStatus.PENDING },
      });
      if (!leaveRequest) {
        throw new NotFoundException('Leave request not found');
      }

      if (leaveRequest.approverId !== employeeInfo.id) {
        throw new ForbiddenException('You are not authorized');
      }

      await this.dataSource.transaction(async (transactionalEntityManager) => {
        if (
          status === ELeaveRequestStatus.APPROVED &&
          leaveRequest.leaveType === ELeaveType.ANNUAL_LEAVE
        ) {
          const requestStart = new Date(leaveRequest.startDate);
          requestStart.setHours(0, 0, 0, 0);
          const y = requestStart.getFullYear();
          const m = requestStart.getMonth();
          const d = requestStart.getDate();

          await transactionalEntityManager.insert(
            AttendanceEntity,
            Array.from({ length: leaveRequest.numberOfDays }, (_, i) => ({
              employeeId: leaveRequest.employeeId,
              workDate: new Date(y, m, d + i),
              checkIn: START_WORK_TIME,
              checkOut: END_WORK_TIME,
              workHours: WORK_HOURS,
              status: EAttendanceStatus.ABSENT,
            })),
          );
        }
        await transactionalEntityManager.update(LeaveRequestEntity, id, {
          status:
            status === ELeaveRequestStatus.APPROVED
              ? ELeaveRequestStatus.APPROVED
              : ELeaveRequestStatus.REJECTED,
          note,
        });
      });
      return 'updated successfully';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }

  async remove(id: number, actor: IUser) {
    try {
      const employeeInfo = requireEmployee(actor);
      const leaveRequest = await this.leaveRequestRepository.findOne({
        where: {
          id,
          employeeId: employeeInfo.id,
          status: ELeaveRequestStatus.PENDING,
        },
      });

      if (!leaveRequest) {
        throw new NotFoundException('Leave request not found');
      }

      await this.leaveRequestRepository.delete(leaveRequest.id);
      return 'deleted successfully';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }
}
