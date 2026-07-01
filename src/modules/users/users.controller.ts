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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('get-all')
  @Roles(Role.ADMIN)
  @ResponseMessage('Get all users successful')
  async getAllUsers(@Query() query: SearchUserQueryDto) {
    return this.usersService.getAllUsers(query);
  }

  @Post('create')
  @Roles(Role.ADMIN)
  @ResponseMessage('Create user successful')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ResponseMessage('Get user by id successful')
  async getUserDetail(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserDetail(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ResponseMessage('Update user successful')
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.updateUser(updateUserDto, id);
  }
}
