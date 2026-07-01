import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { hashString } from '@/common/utils/crypto.util';
import CreateUserDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';
import { UserStatus } from 'generated/prisma/client';
import { SearchUserQueryDto } from './dto/search-user-query.dto';

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
    const where: any = {};

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
    const [users, total] = await Promise.all([
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

  async createUser(createUserDto: CreateUserDto) {
    const userInfo = await this.prismaService.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });
    if (userInfo) {
      throw new BadRequestException('Email already exists');
    }

    const data: any = {
      email: createUserDto.email,
      password: await hashString(createUserDto.password),
      displayName: createUserDto.displayName,
      role: {
        connect: {
          id: createUserDto.roleId,
        },
      },
    };
    if (createUserDto.employeeId) {
      data.employeeId = {
        connect: {
          id: createUserDto.employeeId,
        },
      };
    }
    const newUser = await this.prismaService.user.create({ data });

    return {
      id: newUser.id,
      email: newUser.email,
    };
  }

  async getUserDetail(id: number) {
    const userInfo = await this.prismaService.user.findUnique({
      where: {
        id,
      },
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
    });
    return userInfo;
  }

  async updateUser(updateUserDto: UpdateUserDto, id: number) {
    const userInfo = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (!userInfo) {
      throw new BadRequestException('User not found');
    }
    await this.prismaService.user.update({
      where: {
        id,
      },
      data: updateUserDto,
    });
    return 'Update user successful';
  }

  async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        roleId: true,
        status: true,
      },
    });
    return user;
  }
}
