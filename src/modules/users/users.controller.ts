import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '@/common/constants/role.constant';
import { ResponseMessage } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Body } from '@nestjs/common';
import CreateUserDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';
import { SearchUserQueryDto } from './dto/search-user-query.dto';
import { User } from '@/common/decorators/user.decorator';
import type { IUser } from '@/common/types/user.type';
import type { UserEntity } from './entities/user.entity';
import type { IPaginationResponse } from '@/common/types/common.type';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('all')
  @Roles(Role.ADMIN)
  @ResponseMessage('Get all users successful')
  async getAllUsers(
    @Query() query: SearchUserQueryDto,
  ): Promise<IPaginationResponse<UserEntity>> {
    return this.usersService.getAllUsers(query);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ResponseMessage('Create user successful')
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @User() actor: IUser,
  ): Promise<UserEntity> {
    return this.usersService.createUser(createUserDto, actor);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ResponseMessage('Get user by id successful')
  async getUserDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserEntity> {
    return this.usersService.getUserDetail(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ResponseMessage('Update user successful')
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @Param('id', ParseIntPipe) id: number,
    @User() actor: IUser,
  ) {
    return this.usersService.updateUser(id, updateUserDto, actor);
  }

  // @Delete('delete/:id')
  // @Roles(Role.ADMIN)
  // @ResponseMessage('Delete user successful')
  // async deleteUser(
  //   @Param('id', ParseIntPipe) id: number,
  //   @User() actor: IUser,
  // ) {
  //   try {
  //     return this.usersService.deleteUser(id, actor);
  //   } catch (error) {
  //     throw new HttpException(error.message, HttpStatus.BAD_REQUEST, {
  //       cause: error,
  //     });
  //   }
  // }
}
