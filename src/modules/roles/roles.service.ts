import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import CreateRoleDto from './dto/create-role.dto';
import UpdateRoleDto from './dto/update-role.dto';
import SearchRoleQueryDto from './dto/search-role-query.dto';
import { Not, Repository } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async getAllRoles(query: SearchRoleQueryDto) {
    const { page, limit, sortBy, sortOrder, name } = query;
    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const sortByField = sortBy ?? 'createdAt';
    const sortOrderDirection = sortOrder ?? 'desc';
    const skip = (pageNumber - 1) * limitNumber;
    const where: any = {};
    if (name) {
      where.name = name;
    }
    const [roles, total] = await this.roleRepository.findAndCount({
      where,
      skip,
      take: limitNumber,
      order: {
        [sortByField]: sortOrderDirection,
      },
    });
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
    const normalizedName = createRoleDto.name.toUpperCase().trim();
    const roleInfo = await this.roleRepository.findOne({
      where: {
        name: normalizedName,
      },
    });
    if (roleInfo) {
      throw new BadRequestException('Role already exists');
    }
    const newRole = await this.roleRepository.save({
      name: createRoleDto.name.toUpperCase().trim(),
      description: createRoleDto.description
        ? createRoleDto.description.trim()
        : null,
    });
    return newRole;
  }

  async updateRole(updateRoleDto: UpdateRoleDto, id: number) {
    const roleInfo = await this.roleRepository.findOne({
      where: { id },
    });
    if (!roleInfo) {
      throw new NotFoundException('Role not found');
    }

    const normalizedName = updateRoleDto.name.toUpperCase().trim();
    if (normalizedName !== roleInfo.name) {
      const duplicateRole = await this.roleRepository.findOne({
        where: { name: normalizedName, id: Not(id) },
      });
      if (duplicateRole) {
        throw new BadRequestException('Role already exists');
      }
    }

    const updatedRole = this.roleRepository.merge(roleInfo, {
      name: normalizedName,
      description: updateRoleDto.description
        ? updateRoleDto.description.trim()
        : null,
    });
    return this.roleRepository.save(updatedRole);
  }

  async deleteRole(id: number): Promise<string> {
    const roleInfo = await this.roleRepository.findOne({
      where: { id },
    });
    if (!roleInfo) {
      throw new NotFoundException('Role not found');
    }

    const hasAssignedUsers = await this.roleRepository
      .createQueryBuilder('role')
      .innerJoin('role.users', 'user')
      .where('role.id = :id', { id })
      .getExists();
    if (hasAssignedUsers) {
      throw new BadRequestException(
        'Cannot delete role that is assigned to users',
      );
    }

    await this.roleRepository.remove(roleInfo);
    return 'Delete role successful';
  }

  async validateRoleExists(id: number) {
    const roleInfo = await this.roleRepository.findOne({
      where: { id },
    });
    if (!roleInfo) {
      throw new NotFoundException('Role not found');
    }
  }
}
