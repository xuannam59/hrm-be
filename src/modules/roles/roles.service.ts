import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
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

  private readonly logger = new Logger(RolesService.name);

  async getAllRoles(query: SearchRoleQueryDto) {
    try {
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async createRole(createRoleDto: CreateRoleDto) {
    try {
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
      this.logger.log(`Role ${newRole.name} created successfully`);
      return newRole;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async updateRole(updateRoleDto: UpdateRoleDto, id: number) {
    try {
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
      const savedRole = await this.roleRepository.save(updatedRole);
      this.logger.log(`Role ${savedRole.name} updated successfully`);
      return savedRole;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async deleteRole(id: number): Promise<string> {
    try {
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
      this.logger.log(`Role ${roleInfo.name} deleted successfully`);
      return 'Delete role successful';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async validateRoleExists(id: number) {
    try {
      const roleInfo = await this.roleRepository.findOne({
        where: { id },
      });
      if (!roleInfo) {
        throw new NotFoundException('Role not found');
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
