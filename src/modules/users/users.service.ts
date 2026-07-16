import { buildDisplayName } from '@/common/utils/user-context.util';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { SearchUserQueryDto } from './dto/search-user-query.dto';
import UpdateUserDto from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  private readonly logger = new Logger(UsersService.name);

  async getAllUsers(query: SearchUserQueryDto) {
    try {
      const { page, limit, sortField, sortOrder, role, status, search } = query;

      const skip = (page - 1) * limit;

      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.employee', 'employee')
        .orderBy(`user.${sortField}`, sortOrder)
        .skip(skip)
        .take(limit)
        .select([
          'user.id',
          'user.email',
          'user.displayName',
          'user.status',
          'user.lastLogin',
          'user.createdAt',
          'user.role',
          'employee.id',
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
      const [users, total] = await queryBuilder.getManyAndCount();

      return {
        result: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    }
  }

  // async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
  //   try {
  //     const existingUser = await this.userRepository.findOne({
  //       where: { email: createUserDto.email.trim().toLowerCase() },
  //     });

  //     if (existingUser) {
  //       throw new BadRequestException('Email already exists');
  //     }

  //     const queryBuilder = this.employeeRepository
  //       .createQueryBuilder('employee')
  //       .where('employee.id = :id', { id: createUserDto.employeeId })
  //       .leftJoinAndSelect('employee.user', 'user')
  //       .select([
  //         'employee.id',
  //         'employee.firstName',
  //         'employee.lastName',
  //         'user.id',
  //       ]);

  //     const employee = await queryBuilder.getOne();

  //     if (!employee) {
  //       throw new BadRequestException('EmployeeId is not valid');
  //     }

  //     if (employee.user) {
  //       throw new BadRequestException('Employee already has a user account');
  //     }

  //     createUserDto.displayName = buildDisplayName(
  //       employee.firstName,
  //       employee.lastName,
  //     );

  //     if (
  //       ROLES_REQUIRING_EMPLOYEE.includes(createUserDto.role) &&
  //       !createUserDto.employeeId
  //     ) {
  //       throw new BadRequestException('Employee is required for this role');
  //     }

  //     if (!createUserDto.displayName) {
  //       throw new BadRequestException(
  //         'displayName is required when not linking to an employee',
  //       );
  //     }

  //     const user = this.userRepository.create({
  //       email: createUserDto.email.trim().toLowerCase(),
  //       password: await hashString(createUserDto.password),
  //       displayName: createUserDto.displayName?.trim(),
  //       role: createUserDto.role,
  //       employeeId: createUserDto.employeeId,
  //     });

  //     const newUser = await this.userRepository.save(user);
  //     this.logger.log(`User ${newUser.email} created successfully`);
  //     return newUser;
  //   } catch (error : any) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new HttpException(
  //       'Internal server error',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //       { cause: error },
  //     );
  //   }
  // }

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
          'employee.firstName',
          'employee.lastName',
          'employee.avatar',
        ]);

      const userInfo = await queryBuilder.getOne();
      if (!userInfo) {
        throw new NotFoundException('User not found');
      }
      return userInfo;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<string> {
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
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Internal server error',
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
          status: true,
          employee: {
            id: true,
            departmentId: true,
          },
        },
      });
      return user;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
