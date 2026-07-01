import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from '@/common/constants/role.constant';
import { ResponseMessage } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Body } from '@nestjs/common';
import CreateRoleDto from './dto/create-role.dto';
import UpdateRoleDto from './dto/update-role.dto';
import SearchRoleQueryDto from './dto/search-role-query.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('get-all')
  @Roles(Role.ADMIN)
  @ResponseMessage('Get all roles successful')
  async getAllRoles(@Query() query: SearchRoleQueryDto) {
    return this.rolesService.getAllRoles(query);
  }

  @Post('create')
  @Roles(Role.ADMIN)
  @ResponseMessage('Create role successful')
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ResponseMessage('Update role successful')
  async updateRole(
    @Body() updateRoleDto: UpdateRoleDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.rolesService.updateRole(updateRoleDto, id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ResponseMessage('Delete role successful')
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id);
  }
}
