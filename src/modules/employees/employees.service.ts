import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IUser } from '@/common/types/user.type';
import SearchEmployeeQueryDto from './dto/search-employee-query.dto';
import CreateEmployeeDto from './dto/create-employee.dto';
import ProvisionAccountDto from '@/modules/users/dto/provision-account.dto';
import { Role } from '@/common/constants/role.constant';
import { requireEmployee } from '@/common/utils/user-context.util';
import { generateNextEmployeeCode } from '@/common/utils/employee-code.util';
import { UsersService } from '../users/users.service';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
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
    const where: Prisma.EmployeeWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeCode: { contains: search } },
      ];
    }

    if (actor.roleId === Role.MANAGER) {
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

    const [employees, total] = await this.prismaService.$transaction([
      this.prismaService.employee.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          educations: {
            select: {
              id: true,
              school: true,
              major: true,
              degree: true,
            },
          },
          experiences: {
            select: {
              id: true,
              company: true,
              position: true,
            },
          },
          employmentHistories: {
            select: {
              id: true,
              department: true,
              position: true,
            },
          },
        },
      }),
      this.prismaService.employee.count({ where }),
    ]);

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

  async createEmployee(createEmployeeDto: CreateEmployeeDto, actor: IUser) {
    const department = await this.prismaService.department.findUnique({
      where: { id: createEmployeeDto.departmentId },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (createEmployeeDto.account) {
      const accountEmail = createEmployeeDto.account.email.trim().toLowerCase();
      if (
        createEmployeeDto.email &&
        createEmployeeDto.email.trim().toLowerCase() !== accountEmail
      ) {
        throw new BadRequestException(
          'Account email must match employee email when both are provided',
        );
      }
    }

    const employeeCode = await generateNextEmployeeCode(this.prismaService);

    const employee = await this.prismaService.$transaction(async (tx) => {
      const created = await tx.employee.create({
        data: {
          employeeCode,
          firstName: createEmployeeDto.firstName.trim(),
          lastName: createEmployeeDto.lastName.trim(),
          gender: createEmployeeDto.gender,
          birthday: createEmployeeDto.birthday,
          phone: createEmployeeDto.phone?.trim(),
          address: createEmployeeDto.address?.trim(),
          hireDate: createEmployeeDto.hireDate,
          position: createEmployeeDto.position.trim(),
          departmentId: createEmployeeDto.departmentId,
          employmentHistories: {
            create: {
              departmentId: createEmployeeDto.departmentId,
              position: createEmployeeDto.position.trim(),
              startDate: createEmployeeDto.hireDate,
            },
          },
        },
        include: {
          department: {
            select: { id: true, name: true },
          },
        },
      });

      if (createEmployeeDto.account) {
        const account = await this.usersService.provisionAccountForEmployee(
          created.id,
          createEmployeeDto.account,
          { actorRoleId: actor.roleId },
          tx,
        );
        return { ...created, user: account };
      }

      return { ...created, user: null };
    });

    return employee;
  }

  async provisionAccount(
    employeeId: number,
    dto: ProvisionAccountDto,
    actor: IUser,
  ) {
    const employee = await this.prismaService.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.usersService.provisionAccountForEmployee(employeeId, dto, {
      actorRoleId: actor.roleId,
    });
  }

  async updateEmployee(id: number, updateEmployeeDto: any, ac: IUser) {}

  async updateProfile(updateProfileDto: any, actor: IUser) {}
}
