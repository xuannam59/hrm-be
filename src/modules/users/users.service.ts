import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hashString } from '@/common/utils/crypto.util';
import CreateUserDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';
import { SearchUserQueryDto } from './dto/search-user-query.dto';
import {
  ROLE_ID,
  ROLES_REQUIRING_EMPLOYEE,
} from '@/common/constants/role.constant';
import { buildDisplayName } from '@/common/utils/user-context.util';
import type { IUser } from '@/common/types/user.type';
import { Brackets, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RolesService } from '../roles/roles.service';
import { UserStatus } from '@/common/enums/user-status.enum';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    private readonly rolesService: RolesService,
  ) {}

  async getAllUsers(query: SearchUserQueryDto) {
    const { page, limit, sortBy, sortOrder, roleId, status, search } = query;
    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 10;
    const sortByField = sortBy ?? 'createdAt';
    const sortOrderDirection = sortOrder ?? 'DESC';
    const skip = (pageNumber - 1) * limitNumber;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.employee', 'employee')
      .select([
        'user.id',
        'user.email',
        'user.displayName',
        'user.status',
        'user.lastLogin',
        'user.createdAt',
        'role.id',
        'role.name',
        'employee.id',
        'employee.employeeCode',
        'employee.firstName',
        'employee.lastName',
        'employee.avatar',
      ]);

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('user.email LIKE :search', { search: `%${search}%` });
          qb.orWhere('user.displayName LIKE :search', {
            search: `%${search}%`,
          });
        }),
      );
    }

    if (roleId) {
      queryBuilder.andWhere('user.roleId = :roleId', { roleId });
    }
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }
    const [users, total] = await queryBuilder
      .orderBy(`user.${sortByField}`, sortOrderDirection)
      .skip(skip)
      .take(limitNumber)
      .getManyAndCount();

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

  async createUser(
    createUserDto: CreateUserDto,
    actor: IUser,
  ): Promise<UserEntity> {
    this.assertActorCanAssignRole(actor.roleId, createUserDto.roleId);
    await this.rolesService.validateRoleExists(createUserDto.roleId);

    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email.trim().toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    if (createUserDto.employeeId) {
      const queryBuilder = this.employeeRepository
        .createQueryBuilder('employee')
        .where('employee.id = :id', { id: createUserDto.employeeId })
        .leftJoinAndSelect('employee.user', 'user')
        .select([
          'employee.id',
          'employee.firstName',
          'employee.lastName',
          'user.id',
        ]);
      const employee = await queryBuilder.getOne();

      if (!employee) {
        throw new BadRequestException('EmployeeId is not valid');
      }

      if (employee.user) {
        throw new BadRequestException('Employee already has a user account');
      }
      createUserDto.displayName = buildDisplayName(
        employee.firstName,
        employee.lastName,
      );
    }

    if (
      ROLES_REQUIRING_EMPLOYEE.includes(createUserDto.roleId) &&
      !createUserDto.employeeId
    ) {
      throw new BadRequestException('Employee is required for this role');
    }

    if (!createUserDto.displayName) {
      throw new BadRequestException(
        'displayName is required when not linking to an employee',
      );
    }

    const user = this.userRepository.create({
      email: createUserDto.email.trim().toLowerCase(),
      password: await hashString(createUserDto.password),
      displayName: createUserDto.displayName?.trim(),
      roleId: createUserDto.roleId,
      employeeId: createUserDto.employeeId,
    });

    return this.userRepository.save(user);
  }

  async getUserDetail(id: number): Promise<UserEntity> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.employee', 'employee')
      .select([
        'user.id',
        'user.email',
        'user.displayName',
        'user.status',
        'user.lastLogin',
        'user.createdAt',
        'role.id',
        'role.name',
        'employee.id',
        'employee.employeeCode',
        'employee.firstName',
        'employee.lastName',
        'employee.avatar',
      ]);

    const userInfo = await queryBuilder.getOne();
    if (!userInfo) {
      throw new NotFoundException('User not found');
    }
    return userInfo;
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    actor: IUser,
  ): Promise<string> {
    if (updateUserDto.roleId) {
      this.assertActorCanAssignRole(actor.roleId, updateUserDto.roleId);
    }

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .select([
        'user.id',
        'user.email',
        'user.displayName',
        'user.status',
        'user.lastLogin',
        'user.createdAt',
        'user.roleId',
        'user.employeeId',
      ]);

    const userInfo = await queryBuilder.getOne();

    if (!userInfo) {
      throw new NotFoundException('User not found');
    }

    const user = this.userRepository.create({
      id,
      roleId: updateUserDto.roleId ?? userInfo.roleId,
      status: updateUserDto.status ?? userInfo.status,
      displayName: updateUserDto.displayName?.trim() ?? userInfo.displayName,
    });

    if (userInfo.employee) {
      user.displayName = buildDisplayName(
        userInfo.employee.firstName,
        userInfo.employee.lastName,
      );
    } else if (updateUserDto.displayName) {
      user.displayName = updateUserDto.displayName.trim();
    }
    await this.userRepository.save(user);

    return 'Update user successful';
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: {
        employee: true,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        roleId: true,
        employee: true,
      },
    });
    return user;
  }

  private assertActorCanAssignRole(
    actorRoleId: number | undefined,
    targetRoleId: number,
  ) {
    if (actorRoleId === ROLE_ID.HR && targetRoleId === ROLE_ID.ADMIN) {
      throw new ForbiddenException('HR cannot create or assign admin accounts');
    }
  }
}
