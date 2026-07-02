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
import { ROLE_NAME } from '@/common/constants/role.constant';

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
    const sortOrderDirection = sortOrder ?? 'DESC';
    const skip = (pageNumber - 1) * limitNumber;

    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .orderBy(`role.${sortByField}`, sortOrderDirection)
      .skip(skip)
      .take(limitNumber);

    if (name) {
      queryBuilder.andWhere('role.name LIKE :name', { name: `%${name}%` });
    }
    const [roles, total] = await queryBuilder.getManyAndCount();
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
    const roleInfo = await this.roleRepository.findOne({
      where: {
        name: createRoleDto.name,
      },
    });
    if (roleInfo) {
      throw new BadRequestException('Role already exists');
    }
    const newRole = await this.roleRepository.save({
      name: createRoleDto.name,
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

    if (roleInfo.name === ROLE_NAME.ADMIN) {
      throw new BadRequestException('Cannot update admin role');
    }

    if (updateRoleDto.name !== roleInfo.name) {
      const duplicateRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name, id: Not(id) },
      });
      if (duplicateRole) {
        throw new BadRequestException('Role name already exists');
      }
    }

    const updatedRole = this.roleRepository.merge(roleInfo, {
      name: updateRoleDto.name,
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

    if (roleInfo.name === ROLE_NAME.ADMIN) {
      throw new BadRequestException('Cannot delete admin role');
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
