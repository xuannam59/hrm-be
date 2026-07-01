import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/constants/role.constant';
import { ResponseMessage } from '@/common/decorators/public.decorator';
import type { IUser } from '@/common/types/user.type';
import { User } from '@/common/decorators/user.decorator';
import SearchEmployeeQueryDto from './dto/search-employee-query.dto';
import CreateEmployeeDto from './dto/create-employee.dto';
import ProvisionAccountDto from '@/modules/users/dto/provision-account.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('get-all')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  @ResponseMessage('Get all employees successful')
  async getAllEmployees(
    @Query() query: SearchEmployeeQueryDto,
    @User() actor: IUser,
  ) {
    return this.employeesService.getAllEmployees(query, actor);
  }

  @Post('create')
  @Roles(Role.ADMIN, Role.HR)
  @ResponseMessage('Create employee successful')
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @User() actor: IUser,
  ) {
    return this.employeesService.createEmployee(createEmployeeDto, actor);
  }

  @Post(':id/provision-account')
  @Roles(Role.ADMIN, Role.HR)
  @ResponseMessage('Provision account successful')
  async provisionAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() provisionAccountDto: ProvisionAccountDto,
    @User() actor: IUser,
  ) {
    return this.employeesService.provisionAccount(
      id,
      provisionAccountDto,
      actor,
    );
  }

  @Patch('update/:id')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  @ResponseMessage('Update employee successful')
  async updateEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: any,
    @User() actor: IUser,
  ) {
    return this.employeesService.updateEmployee(id, updateEmployeeDto, actor);
  }
}
