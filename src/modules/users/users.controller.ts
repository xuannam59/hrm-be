import { ERole } from '@/common/constants/user.constant';
import { ResponseMessage } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { IPaginationResponse } from '@/common/types/common.type';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { SearchUserQueryDto } from './dto/search-user-query.dto';
import UpdateUserDto from './dto/update-user.dto';
import type { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('all')
  @Roles(ERole.ADMIN)
  @ResponseMessage('Get all users successful')
  async getAllUsers(
    @Query() query: SearchUserQueryDto,
  ): Promise<IPaginationResponse<UserEntity>> {
    return this.usersService.getAllUsers(query);
  }

  @Get(':id')
  @Roles(ERole.ADMIN)
  @ResponseMessage('Get user by id successful')
  async getUserDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserEntity> {
    return this.usersService.getUserDetail(id);
  }

  @Patch(':id')
  @Roles(ERole.ADMIN)
  @ResponseMessage('Update user successful')
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  // @Delete('delete/:id')
  // @Roles(ERole.ADMIN)
  // @ResponseMessage('Delete user successful')
  // async deleteUser(
  //   @Param('id', ParseIntPipe) id: number,
  //   @User() actor: IUser,
  // ) {
  //   try {
  //     return this.usersService.deleteUser(id, actor);
  //   } catch (error : any) {
  //     throw new HttpException(error.message, HttpStatus.BAD_REQUEST, {
  //       cause: error,
  //     });
  //   }
  // }
}
