import { Injectable } from '@nestjs/common';
import { IUser } from '@/common/types/user.type';
import SearchEmployeeQueryDto from './dto/search-employee-query.dto';
import CreateEmployeeDto from './dto/create-employee.dto';
import ProvisionAccountDto from '@/modules/users/dto/provision-account.dto';
import { requireEmployee } from '@/common/utils/user-context.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from './entities/employee.entity';
import { DepartmentEntity } from '../departments/entities/department.entity';
import { ROLE_ID } from '@/common/constants/role.constant';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
  ) {}

  async getAllEmployees(query: SearchEmployeeQueryDto, actor: IUser) {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      departmentId,
      status,
      position,
    } = query;
    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const sortByField = sortBy ?? 'createdAt';
    const sortOrderDirection = sortOrder ?? 'desc';
    const skip = (pageNumber - 1) * limitNumber;
    const orderBy = {
      [sortByField]: sortOrderDirection,
    };
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeCode: { contains: search } },
      ];
    }

    if (actor.roleId === ROLE_ID.MANAGER) {
      const employee = requireEmployee(actor);
      where.departmentId = employee.departmentId;
    } else if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status) {
      where.status = status;
    }
    if (position) {
      where.position = position;
    }

    const [employees, total] = await this.employeeRepository.findAndCount({
      where,
      skip,
      take: limitNumber,
      order: orderBy,
      relations: {
        user: true,
        department: true,
      },
    });

    return {
      result: employees,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async createEmployee(createEmployeeDto: CreateEmployeeDto, actor: IUser) {}

  async provisionAccount(
    id: number,
    provisionAccountDto: ProvisionAccountDto,
    actor: IUser,
  ) {}

  async updateEmployee(id: number, updateEmployeeDto: any, ac: IUser) {}

  async updateProfile(updateProfileDto: any, actor: IUser) {}
}
