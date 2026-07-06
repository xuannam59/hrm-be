import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { hashString } from '@/common/utils/crypto.util';
import CreateUserDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';
import { SearchUserQueryDto } from './dto/search-user-query.dto';
import {
  Role,
  ROLES_REQUIRING_EMPLOYEE,
} from '@/common/constants/role.constant';
import { buildDisplayName } from '@/common/utils/user-context.util';
import type { IUser } from '@/common/types/user.type';
import { Brackets, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  private readonly logger = new Logger(UsersService.name);

  async getAllUsers(query: SearchUserQueryDto) {
    try {
      const { page, limit, sortBy, sortOrder, role, status, search } = query;
      const pageNumber = page ?? 1;
      const limitNumber = limit ?? 10;
      const sortByField = sortBy ?? 'createdAt';
      const sortOrderDirection = sortOrder ?? 'DESC';
      const skip = (pageNumber - 1) * limitNumber;

      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.employee', 'employee')
        .select([
          'user.id',
          'user.email',
          'user.displayName',
          'user.status',
          'user.lastLogin',
          'user.createdAt',
          'user.role',
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

      if (role) {
        queryBuilder.andWhere('user.role = :role', { role });
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

  async createUser(
    createUserDto: CreateUserDto,
    actor: IUser,
  ): Promise<UserEntity> {
    try {
      this.assertActorCanAssignRole(actor.role, createUserDto.role);

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
        ROLES_REQUIRING_EMPLOYEE.includes(createUserDto.role) &&
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
        role: createUserDto.role,
        employeeId: createUserDto.employeeId,
      });

      const newUser = await this.userRepository.save(user);
      this.logger.log(`User ${newUser.email} created successfully`);
      return newUser;
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

  async getUserDetail(id: number): Promise<UserEntity> {
    try {
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .where('user.id = :id', { id })
        .leftJoinAndSelect('user.employee', 'employee')
        .select([
          'user.id',
          'user.email',
          'user.displayName',
          'user.status',
          'user.lastLogin',
          'user.createdAt',
          'user.role',
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

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    actor: IUser,
  ): Promise<string> {
    try {
      if (updateUserDto.role) {
        this.assertActorCanAssignRole(actor.role, updateUserDto.role);
      }

      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .where('user.id = :id', { id })
        .leftJoinAndSelect('user.employee', 'employee')
        .select([
          'user.id',
          'user.email',
          'user.displayName',
          'user.status',
          'user.lastLogin',
          'user.createdAt',
          'user.role',
          'user.employeeId',
          'employee.id',
          'employee.firstName',
          'employee.lastName',
        ]);

      const userInfo = await queryBuilder.getOne();

      if (!userInfo) {
        throw new NotFoundException('User not found');
      }

      const user = this.userRepository.create({
        id,
        role: updateUserDto.role ?? userInfo.role,
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
      const updatedUser = await this.userRepository.save(user);
      this.logger.log(`User ${updatedUser.email} updated successfully`);
      return 'Update user successful';
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

  async findByEmail(email: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        relations: {
          employee: true,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          employee: true,
        },
      });
      return user;
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

  private assertActorCanAssignRole(
    actorRole: Role | undefined,
    targetRole: Role,
  ) {
    if (actorRole === Role.HR && targetRole === Role.ADMIN) {
      throw new ForbiddenException('HR cannot create or assign admin accounts');
    }
  }
}
