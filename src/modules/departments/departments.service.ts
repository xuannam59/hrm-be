import { ERole } from '@/common/constants/user.constant';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import SearchDepartmentQueryDto from './dto/search-department-query.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentEntity } from './entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  private readonly logger = new Logger(DepartmentsService.name);

  async createDepartment(createDepartmentDto: CreateDepartmentDto) {
    try {
      if (createDepartmentDto.managerId) {
        const [employeeInfo, checkManager] = await Promise.all([
          this.employeeRepository.findOne({
            where: { id: createDepartmentDto.managerId },
            relations: { user: true },
            select: {
              id: true,
              user: { id: true, role: true },
            },
          }),
          this.departmentRepository.exists({
            where: { managerId: createDepartmentDto.managerId },
          }),
        ]);

        if (!employeeInfo) {
          throw new NotFoundException('Employee not found');
        }

        if (checkManager) {
          throw new BadRequestException(
            'Manager already assigned to another department',
          );
        }

        if (!employeeInfo.user || employeeInfo.user.role !== ERole.MANAGER) {
          throw new BadRequestException('Employee is not a manager');
        }
      }

      const newDepartment = this.departmentRepository.create({
        name: createDepartmentDto.name,
        description: createDepartmentDto.description,
        managerId: createDepartmentDto.managerId,
      });

      try {
        const department = await this.departmentRepository.save(newDepartment);
        this.logger.log(`Department ${department.name} created successfully `);
        return department;
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
          throw new BadRequestException(
            'Manager already assigned to another department',
          );
        }
        throw error;
      }
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

  async getAllDepartments(query: SearchDepartmentQueryDto) {
    try {
      const { page, limit, sortField, sortOrder, search } = query;
      const skip = (page - 1) * limit;

      const queryBuilder = this.departmentRepository
        .createQueryBuilder('department')
        .leftJoinAndSelect('department.manager', 'manager')
        .leftJoinAndSelect('department.employees', 'employees')
        .orderBy(`department.${sortField}`, sortOrder)
        .skip(skip)
        .take(limit)
        .select([
          'department.id',
          'department.name',
          'department.description',
          'department.createdAt',
          'department.updatedAt',
          'manager.id',
          'manager.firstName',
          'manager.lastName',
          'manager.phone',
          'manager.position',
          'employees.id',
        ]);

      if (search) {
        queryBuilder.andWhere('department.name LIKE :search', {
          search: `%${search}%`,
        });
      }

      const [departments, total] = await queryBuilder.getManyAndCount();

      return {
        result: departments,
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

  async updateDepartment(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    try {
      if (updateDepartmentDto.managerId) {
        const [employeeInfo, checkManager] = await Promise.all([
          this.employeeRepository.findOne({
            where: { id: updateDepartmentDto.managerId },
            relations: { user: true },
            select: {
              id: true,
              user: { id: true, role: true },
            },
          }),
          this.departmentRepository.exists({
            where: {
              managerId: updateDepartmentDto.managerId,
              id: Not(id),
            },
          }),
        ]);

        if (!employeeInfo) {
          throw new NotFoundException('Employee not found');
        }

        if (employeeInfo.user && employeeInfo.user.role !== ERole.MANAGER) {
          throw new BadRequestException('Employee is not a manager');
        }

        if (checkManager) {
          throw new BadRequestException(
            'Manager already assigned to another department',
          );
        }
      }

      try {
        await this.departmentRepository.update(id, updateDepartmentDto);
        this.logger.log(`Department ${id} updated successfully`);
        return 'Update department successful';
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
          throw new BadRequestException(
            'Manager already assigned to another department',
          );
        }
        throw error;
      }
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

  async removeDepartment(id: number) {
    try {
      await this.departmentRepository.softDelete(id);

      this.logger.log(`Department ${id} deleted successfully`);
      return 'Delete department successful';
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
