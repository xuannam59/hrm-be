import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import CreateRoleDto from './dto/create-role.dto';
import UpdateRoleDto from './dto/update-role.dto';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import SearchRoleQueryDto from './dto/search-role-query.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllRoles(query: SearchRoleQueryDto) {
    const { page, limit, sortBy, sortOrder, name } = query;
    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const sortByField = sortBy ?? 'createdAt';
    const sortOrderDirection = sortOrder ?? 'desc';
    const skip = (pageNumber - 1) * limitNumber;
    const orderBy = {
      [sortByField]: sortOrderDirection,
    };
    const where: any = {};
    if (name) {
      where.name = name;
    }
    const [roles, total] = await Promise.all([
      this.prismaService.role.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy,
      }),
      this.prismaService.role.count({ where }),
    ]);
    return {
      result: roles,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async createRole(createRoleDto: CreateRoleDto) {
    const roleInfo = await this.prismaService.role.findUnique({
      where: {
        name: createRoleDto.name,
      },
    });
    if (roleInfo) {
      throw new BadRequestException('Role already exists');
    }
    const newRole = await this.prismaService.role.create({
      data: {
        name: createRoleDto.name.toUpperCase().trim(),
        description: createRoleDto.description
          ? createRoleDto.description.trim()
          : null,
      },
    });
    return newRole;
  }

  async updateRole(updateRoleDto: UpdateRoleDto, id: number) {
    const roleInfo = await this.prismaService.role.findUnique({
      where: { id },
    });
    if (!roleInfo) {
      throw new NotFoundException('Role not found');
    }
    const updatedRole = await this.prismaService.role.update({
      where: { id },
      data: {
        name: updateRoleDto.name.toUpperCase().trim(),
        description: updateRoleDto.description
          ? updateRoleDto.description.trim()
          : null,
      },
    });
    return updatedRole;
  }

  async deleteRole(id: number) {
    const roleInfo = await this.prismaService.role.findUnique({
      where: { id },
    });
    if (!roleInfo) {
      throw new NotFoundException('Role not found');
    }
    await this.prismaService.role.delete({
      where: { id },
    });
    return 'Delete role successful';
  }
}
