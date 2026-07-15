import {
  ALLOWED_SORT_FIELDS_EDUCATION,
  EDUCATION_SELECT,
} from '@/common/constants/education.constant';
import { ERole } from '@/common/constants/user.constant';
import { IUser } from '@/common/types/user.type';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { CreateEmployeeEducationDto } from './dto/create-employee-education.dto';
import { SearchEmployeeEducationQueryDto } from './dto/search-employee-education-query.dto';
import { UpdateEmployeeEducationDto } from './dto/update-employee-education.dto';
import { EmployeeEducationEntity } from './entities/employee-education.entity';

@Injectable()
export class EmployeeEducationsService {
  constructor(
    @InjectRepository(EmployeeEducationEntity)
    private readonly employeeEducationRepository: Repository<EmployeeEducationEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  async create(createEmployeeEducationDto: CreateEmployeeEducationDto) {
    try {
      const { employeeId, school, degree, fieldOfStudy, startYear, endYear } =
        createEmployeeEducationDto;

      const employeeEducation = this.employeeEducationRepository.create({
        employeeId,
        school,
        degree,
        fieldOfStudy,
        startYear,
        endYear,
      });

      return await this.employeeEducationRepository.save(employeeEducation);
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

  async findAll(query: SearchEmployeeEducationQueryDto, actor: IUser) {
    try {
      const {
        page,
        limit,
        sortField,
        sortOrder,
        employeeId,
        school,
        degree,
        fieldOfStudy,
        startYear,
        endYear,
      } = query;

      const skip = (page - 1) * limit;

      const safeSortField = ALLOWED_SORT_FIELDS_EDUCATION.includes(sortField)
        ? sortField
        : 'createdAt';

      const queryBuilder = this.employeeEducationRepository
        .createQueryBuilder('employeeEducation')
        .leftJoinAndSelect('employeeEducation.employee', 'employee')
        .orderBy(`employeeEducation.${safeSortField}`, sortOrder)
        .skip(skip)
        .take(limit)
        .select(EDUCATION_SELECT);

      if (actor.role === ERole.MANAGER) {
        queryBuilder.andWhere('employee.departmentId = :departmentId', {
          departmentId: actor.employee.departmentId,
        });
      }

      if (employeeId) {
        queryBuilder.andWhere('employeeEducation.employeeId = :employeeId', {
          employeeId,
        });
      }

      if (school) {
        queryBuilder.andWhere('employeeEducation.school LIKE :school', {
          school: `%${school}%`,
        });
      }

      if (degree) {
        queryBuilder.andWhere('employeeEducation.degree LIKE :degree', {
          degree: `%${degree}%`,
        });
      }

      if (fieldOfStudy) {
        queryBuilder.andWhere(
          'employeeEducation.fieldOfStudy LIKE :fieldOfStudy',
          { fieldOfStudy: `%${fieldOfStudy}%` },
        );
      }

      if (startYear) {
        queryBuilder.andWhere('employeeEducation.startYear >= :startYear', {
          startYear,
        });
      }

      if (endYear) {
        queryBuilder.andWhere('employeeEducation.endYear <= :endYear', {
          endYear,
        });
      }

      const [employeeEducations, total] = await queryBuilder.getManyAndCount();

      return {
        result: employeeEducations,
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

  async findMyEducations(actor: IUser) {
    try {
      const queryBuilder = this.employeeEducationRepository
        .createQueryBuilder('employeeEducation')
        .where('employeeEducation.employeeId = :id', { id: actor.employee.id })
        .select([
          'employeeEducation.id',
          'employeeEducation.employeeId',
          'employeeEducation.school',
          'employeeEducation.degree',
          'employeeEducation.fieldOfStudy',
          'employeeEducation.startYear',
          'employeeEducation.endYear',
          'employeeEducation.createdAt',
          'employeeEducation.updatedAt',
        ]);

      const employeeEducation = await queryBuilder.getMany();

      return employeeEducation;
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

  async findOne(id: number, actor: IUser) {
    try {
      const queryBuilder = this.employeeEducationRepository
        .createQueryBuilder('employeeEducation')
        .leftJoinAndSelect('employeeEducation.employee', 'employee')
        .where('employeeEducation.id = :id', { id })
        .select([
          'employeeEducation.id',
          'employeeEducation.employeeId',
          'employeeEducation.school',
          'employeeEducation.degree',
          'employeeEducation.fieldOfStudy',
          'employeeEducation.startYear',
          'employeeEducation.endYear',
          'employeeEducation.createdAt',
          'employeeEducation.updatedAt',
          'employee.id',
          'employee.firstName',
          'employee.lastName',
          'employee.position',
        ]);

      if (actor.role !== ERole.ADMIN) {
        queryBuilder.andWhere('employee.departmentId = :departmentId', {
          departmentId: actor.employee.departmentId,
        });
      }

      const employeeEducation = await queryBuilder.getOne();
      if (!employeeEducation) {
        throw new NotFoundException('Employee education not found');
      }

      return employeeEducation;
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

  async update(
    id: number,
    updateEmployeeEducationDto: UpdateEmployeeEducationDto,
    actor: IUser,
  ) {
    try {
      const { school, degree, fieldOfStudy, startYear, endYear } =
        updateEmployeeEducationDto;

      const employeeEducation = await this.employeeEducationRepository.findOne({
        where: { id },
        select: { id: true, employeeId: true },
      });

      if (!employeeEducation) {
        throw new NotFoundException('Employee education not found');
      }

      if (actor.role !== ERole.ADMIN) {
        if (employeeEducation.employeeId !== actor.employee.id) {
          throw new ForbiddenException('You are not authorized');
        }
      }

      await this.employeeEducationRepository.update(id, {
        school,
        degree,
        fieldOfStudy,
        startYear,
        endYear,
      });

      return 'Employee education updated successfully';
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

  async remove(id: number) {
    try {
      const employeeEducation = await this.employeeEducationRepository.findOne({
        where: { id },
        select: { id: true, employeeId: true },
      });

      if (!employeeEducation) {
        throw new NotFoundException('Employee education not found');
      }

      await this.employeeEducationRepository.softDelete(id);
      return 'Employee education deleted successfully';
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
}
