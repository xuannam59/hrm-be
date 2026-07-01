import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/constants/role.constant';
import { ResponseMessage } from '@/common/decorators/public.decorator';
import type { IUser } from '@/common/types/user.type';
import { User } from '@/common/decorators/user.decorator';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post('admin/create-employee')
  @Roles(Role.ADMIN)
  @ResponseMessage('Create employee successful')
  async createEmployee(@Body() createEmployeeDto: any) {
    return this.employeesService.createEmployee(createEmployeeDto);
  }

  @Patch('update-employee')
  @ResponseMessage('Update employee successful')
  async updateEmployee(@Body() updateEmployeeDto: any, @User() user: IUser) {
    return this.employeesService.updateEmployee(updateEmployeeDto, user);
  }

  @Get('get-all-employees')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ResponseMessage('Get all employees successful')
  async getAllEmployees(@Query() query: any, @User() user: IUser) {
    return this.employeesService.getAllEmployees(query, user);
  }
}
