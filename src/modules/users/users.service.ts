import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { hashString } from '@/common/utils/crypto.util';
import CreateUserDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';
import ProvisionAccountDto from './dto/provision-account.dto';
import { EmployeeStatus, Prisma, PrismaClient } from 'generated/prisma/client';
import { SearchUserQueryDto } from './dto/search-user-query.dto';
import {
  Role,
  ROLES_REQUIRING_EMPLOYEE,
} from '@/common/constants/role.constant';
import { buildDisplayName } from '@/common/utils/user-context.util';
import { IUser } from '@/common/types/user.type';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllUsers(query: SearchUserQueryDto) {
    const { page, limit, sortBy, sortOrder, roleId, status, search } = query;
    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const sortByField = sortBy ?? 'createdAt';
    const sortOrderDirection = sortOrder ?? 'desc';
    const skip = (pageNumber - 1) * limitNumber;
    const orderBy = {
      [sortByField]: sortOrderDirection,
    };
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { displayName: { contains: search } },
      ];
    }

    if (roleId) {
      where.roleId = roleId;
    }
    if (status) {
      where.status = status;
    }
    const [users, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      this.prismaService.user.count({
        where,
      }),
    ]);
    return {
      result: users,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async createUser(createUserDto: CreateUserDto, actor: IUser) {
    this.assertActorCanAssignRole(actor.roleId, createUserDto.roleId);
    await this.validateRoleExists(createUserDto.roleId);

    if (createUserDto.employeeId) {
      return this.provisionAccountForEmployee(
        createUserDto.employeeId,
        {
          email: createUserDto.email,
          password: createUserDto.password,
          roleId: createUserDto.roleId,
        },
        { actorRoleId: actor.roleId },
      );
    }

    const existingUser = await this.prismaService.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    await this.validateUserEmployeeLink(createUserDto.roleId);

    const displayName = createUserDto.displayName?.trim();
    if (!displayName) {
      throw new BadRequestException(
        'displayName is required when not linking to an employee',
      );
    }

    const newUser = await this.prismaService.user.create({
      data: {
        email: createUserDto.email.trim().toLowerCase(),
        password: await hashString(createUserDto.password),
        displayName,
        role: { connect: { id: createUserDto.roleId } },
      },
      select: this.userWithEmployeeSelect,
    });

    return newUser;
  }

  async provisionAccountForEmployee(
    employeeId: number,
    dto: ProvisionAccountDto,
    options?: { actorRoleId?: number; excludeUserId?: number },
    tx?: TransactionClient,
  ) {
    const roleId = dto.roleId ?? Role.EMPLOYEE;
    this.assertActorCanAssignRole(options?.actorRoleId, roleId);
    await this.validateRoleExists(roleId);

    const employee = await this.validateUserEmployeeLink(
      roleId,
      employeeId,
      options?.excludeUserId,
    );
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const email = dto.email.trim().toLowerCase();

    const existingUser = await (tx ?? this.prismaService).user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const client = tx ?? this.prismaService;
    const displayName = buildDisplayName(employee.firstName, employee.lastName);

    const newUser = await client.user.create({
      data: {
        email,
        password: await hashString(dto.password),
        displayName,
        role: { connect: { id: roleId } },
        employee: { connect: { id: employeeId } },
      },
      select: this.userWithEmployeeSelect,
    });

    return newUser;
  }

  async getUserDetail(id: number) {
    const userInfo = await this.prismaService.user.findUnique({
      where: { id },
      select: this.userWithEmployeeSelect,
    });
    if (!userInfo) {
      throw new NotFoundException('User not found');
    }
    return userInfo;
  }

  async updateUser(updateUserDto: UpdateUserDto, id: number) {
    const userInfo = await this.prismaService.user.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!userInfo) {
      throw new NotFoundException('User not found');
    }

    const nextRoleId = updateUserDto.roleId ?? userInfo.roleId;
    let nextEmployeeId = userInfo.employeeId;

    if (updateUserDto.unlinkEmployee) {
      nextEmployeeId = null;
    } else if (updateUserDto.employeeId !== undefined) {
      nextEmployeeId = updateUserDto.employeeId;
    }

    if (updateUserDto.roleId !== undefined) {
      await this.validateRoleExists(updateUserDto.roleId);
    }

    const employee = await this.validateUserEmployeeLink(
      nextRoleId,
      nextEmployeeId ?? undefined,
      id,
    );

    const data: Prisma.UserUpdateInput = {};

    if (updateUserDto.roleId !== undefined) {
      data.role = { connect: { id: updateUserDto.roleId } };
    }

    if (updateUserDto.unlinkEmployee) {
      data.employee = { disconnect: true };
    } else if (updateUserDto.employeeId !== undefined) {
      data.employee = { connect: { id: updateUserDto.employeeId } };
    }

    if (employee) {
      data.displayName = buildDisplayName(
        employee.firstName,
        employee.lastName,
      );
    } else if (updateUserDto.displayName) {
      data.displayName = updateUserDto.displayName.trim();
    }

    await this.prismaService.user.update({
      where: { id },
      data,
    });

    return 'Update user successful';
  }

  async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        displayName: true,
        roleId: true,
        status: true,
        employee: {
          select: {
            id: true,
            departmentId: true,
            employeeCode: true,
          },
        },
      },
    });
    return user;
  }

  private readonly userWithEmployeeSelect = {
    id: true,
    email: true,
    displayName: true,
    role: {
      select: {
        id: true,
        name: true,
      },
    },
    employee: {
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    },
  };

  private assertActorCanAssignRole(
    actorRoleId: number | undefined,
    targetRoleId: number,
  ) {
    if (actorRoleId === Role.HR && targetRoleId === Role.ADMIN) {
      throw new ForbiddenException('HR cannot create or assign admin accounts');
    }
  }

  private async validateRoleExists(roleId: number) {
    const role = await this.prismaService.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  private async validateUserEmployeeLink(
    roleId: number,
    employeeId?: number,
    excludeUserId?: number,
  ) {
    if (ROLES_REQUIRING_EMPLOYEE.includes(roleId) && !employeeId) {
      throw new BadRequestException(
        'This role requires linking to an employee',
      );
    }

    if (roleId === Role.ADMIN && employeeId) {
      throw new BadRequestException(
        'Admin account should not be linked to an employee',
      );
    }

    if (!employeeId) {
      return null;
    }

    const employee = await this.prismaService.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.user && employee.user.id !== excludeUserId) {
      throw new BadRequestException('Employee already has a user account');
    }

    if (employee.status !== EmployeeStatus.WORKING) {
      throw new BadRequestException(
        'Cannot link user to a non-working employee',
      );
    }

    return employee;
  }
}
