import { START_WORK_TIME } from '@/common/constants/attendance.constant';
import { ERole } from '@/common/constants/role.constant';
import { EAttendanceStatus } from '@/common/types/attendance.type';
import { IPaginationResponse } from '@/common/types/common.type';
import { EEmployeeStatus } from '@/common/types/employee.type';
import { IUser } from '@/common/types/user.type';
import {
  calculateWorkHours,
  formatLocalTime,
  getTodayDate,
  getTodayWorkDate,
  timeToMinutes,
  validateDay,
} from '@/common/utils/date.util';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import {
  SearchAttendanceQueryDto,
  SearchMyAttendanceQueryDto,
} from './dto/sreach-attendance-query.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceEntity } from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}
  private readonly logger = new Logger(AttendanceService.name);

  async checkIn(actor: IUser) {
    try {
      const employee = await this.employeeRepository.findOne({
        where: { id: actor.employee.id, status: EEmployeeStatus.WORKING },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found or not working');
      }

      const workDate = getTodayWorkDate();
      const now = new Date();

      const existing = await this.attendanceRepository.findOne({
        where: {
          employeeId: employee.id,
          workDate,
        },
      });

      if (existing) {
        throw new ConflictException('Already checked in today');
      }

      const newAttendance = this.attendanceRepository.create({
        employeeId: employee.id,
        workDate,
        checkIn: formatLocalTime(),
        status: this.resolveStatus(now),
        workHours: 0,
      });

      const saved = await this.attendanceRepository.save(newAttendance);

      this.logger.log(
        `Check in successful for employee ${employee.id} on ${getTodayDate()}`,
      );
      return saved;
    } catch (error) {
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

  async checkOut(actor: IUser) {
    try {
      const workDate = getTodayWorkDate();
      const now = new Date();

      const attendance = await this.attendanceRepository.findOne({
        where: {
          employeeId: actor.employee.id,
          workDate,
        },
      });

      if (!attendance) {
        throw new NotFoundException('No check-in record found for today');
      }

      if (!attendance.checkIn) {
        throw new BadRequestException('Cannot check out without check-in time');
      }

      if (attendance.checkOut) {
        throw new ConflictException('Already checked out today');
      }

      const checkOut = formatLocalTime(now);
      attendance.checkOut = checkOut;
      attendance.workHours = calculateWorkHours(attendance.checkIn, checkOut);

      const saved = await this.attendanceRepository.save(attendance);

      this.logger.log(
        `Check out successful for employee ${actor.employee.id} on ${getTodayDate()}`,
      );
      return saved;
    } catch (error) {
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

  async findAll(
    query: SearchAttendanceQueryDto,
    actor: IUser,
  ): Promise<IPaginationResponse<AttendanceEntity>> {
    try {
      const {
        page,
        limit,
        sortField,
        sortOrder,
        from,
        to,
        employeeId,
        departmentId,
        status,
      } = query;

      const skip = (page - 1) * limit;

      const queryBuilder = this.attendanceRepository
        .createQueryBuilder('attendance')
        .leftJoinAndSelect('attendance.employee', 'employee')
        .leftJoinAndSelect('employee.department', 'department')
        .skip(skip)
        .take(limit)
        .orderBy(`attendance.${sortField}`, sortOrder)
        .select([
          'attendance.id',
          'attendance.employeeId',
          'attendance.workDate',
          'attendance.checkIn',
          'attendance.checkOut',
          'attendance.workHours',
          'attendance.status',
          'attendance.createdAt',
          'attendance.updatedAt',
          'employee.id',
          'employee.employeeCode',
          'employee.firstName',
          'employee.lastName',
          'employee.position',
          'employee.departmentId',
          'department.id',
          'department.name',
        ]);

      if (from) {
        queryBuilder.andWhere('attendance.workDate >= :from', {
          from: new Date(from.setHours(0, 0, 0, 0)),
        });
      }

      if (to) {
        queryBuilder.andWhere('attendance.workDate <= :to', {
          to: new Date(to.setHours(23, 59, 59, 999)),
        });
      }

      if (employeeId) {
        queryBuilder.andWhere('attendance.employeeId = :employeeId', {
          employeeId,
        });
      }

      if (actor.role === ERole.MANAGER) {
        queryBuilder.andWhere('employee.departmentId = :managerDepartmentId', {
          managerDepartmentId: actor.employee.departmentId,
        });
      } else if (departmentId) {
        queryBuilder.andWhere('employee.departmentId = :departmentId', {
          departmentId,
        });
      }

      if (status) {
        queryBuilder.andWhere('attendance.status = :status', { status });
      }

      const [result, total] = await queryBuilder.getManyAndCount();

      return {
        result,
        pagination: {
          total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
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

  async getMyAttendance(
    query: SearchMyAttendanceQueryDto,
    actor: IUser,
  ): Promise<AttendanceEntity[]> {
    try {
      const { year, month, day } = query;

      const dateRange = this.resolveMyAttendanceDateRange(year, month, day);

      const queryBuilder = this.attendanceRepository
        .createQueryBuilder('attendance')
        .where('attendance.employeeId = :employeeId', {
          employeeId: actor.employee.id,
        })
        .orderBy('attendance.workDate', 'DESC')
        .select([
          'attendance.id',
          'attendance.employeeId',
          'attendance.workDate',
          'attendance.checkIn',
          'attendance.checkOut',
          'attendance.workHours',
          'attendance.status',
          'attendance.createdAt',
          'attendance.updatedAt',
        ]);

      if (dateRange.from) {
        queryBuilder.andWhere('attendance.workDate >= :from', {
          from: dateRange.from,
        });
      }

      if (dateRange.to) {
        queryBuilder.andWhere('attendance.workDate <= :to', {
          to: dateRange.to,
        });
      }

      return await queryBuilder.getMany();
    } catch (error) {
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

  async updateAttendance(
    id: number,
    body: UpdateAttendanceDto,
    actor: IUser,
  ): Promise<AttendanceEntity> {
    try {
      const attendance = await this.attendanceRepository.findOne({
        where: { id },
        relations: { employee: true },
        select: {
          id: true,
          employeeId: true,
          workDate: true,
          checkIn: true,
          checkOut: true,
          workHours: true,
          status: true,
          employee: {
            id: true,
            departmentId: true,
          },
        },
      });

      if (!attendance) {
        throw new NotFoundException('Attendance not found');
      }

      if (actor.role === ERole.MANAGER) {
        if (attendance.employee.departmentId !== actor.employee.departmentId) {
          throw new ForbiddenException(
            'You can only update attendance for employees in your department',
          );
        }
      }

      const checkInNumber = timeToMinutes(body.checkIn ?? attendance.checkIn);
      const checkOutNumber = timeToMinutes(
        body.checkOut ?? attendance.checkOut,
      );

      if (body.checkOut !== undefined && !checkInNumber) {
        throw new BadRequestException(
          'checkIn is required when setting checkOut',
        );
      }

      if (checkInNumber && checkOutNumber && checkOutNumber < checkInNumber) {
        throw new BadRequestException('checkOut must be after checkIn');
      }

      if (body.checkIn !== undefined) {
        attendance.checkIn = body.checkIn;
      }

      if (body.checkOut !== undefined) {
        attendance.checkOut = body.checkOut;
      }

      if (body.checkIn !== undefined || body.checkOut !== undefined) {
        if (attendance.checkIn && attendance.checkOut) {
          attendance.workHours = calculateWorkHours(
            attendance.checkIn,
            attendance.checkOut,
          );
        } else {
          attendance.workHours = 0;
        }
      }

      if (body.status !== undefined) {
        attendance.status = body.status;
      } else if (body.checkIn !== undefined && attendance.checkIn) {
        const [h, m, s] = attendance.checkIn.split(':').map(Number);
        const checkTime = new Date();
        checkTime.setHours(h, m, s, 0);
        attendance.status = this.resolveStatus(checkTime);
      }

      const saved = await this.attendanceRepository.save(attendance);

      this.logger.log(
        `Attendance ${id} updated by user ${actor.id} (role: ${actor.role})`,
      );
      return saved;
    } catch (error) {
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

  private resolveMyAttendanceDateRange(
    year?: number,
    month?: number,
    day?: number,
  ): { from?: Date; to?: Date } {
    if (month !== undefined && year === undefined) {
      throw new BadRequestException('year is required when month is provided');
    }

    if (day !== undefined && (year === undefined || month === undefined)) {
      throw new BadRequestException(
        'year and month are required when day is provided',
      );
    }

    if (year === undefined) {
      return {};
    }

    if (month !== undefined) {
      if (day !== undefined) {
        validateDay(year, month, day);
        return {
          from: new Date(year, month - 1, day, 0, 0, 0, 0),
          to: new Date(year, month - 1, day, 23, 59, 59, 999),
        };
      }

      return {
        from: new Date(year, month - 1, 1, 0, 0, 0, 0),
        to: new Date(year, month, 0, 23, 59, 59, 999),
      };
    }

    return {
      from: new Date(year, 0, 1, 0, 0, 0, 0),
      to: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }

  private resolveStatus(checkTime: Date): EAttendanceStatus {
    const [h, m] = START_WORK_TIME.split(':').map(Number);
    const start = new Date(checkTime);
    start.setHours(h, m, 0, 0);

    return checkTime > start
      ? EAttendanceStatus.LATE
      : EAttendanceStatus.PRESENT;
  }
}
