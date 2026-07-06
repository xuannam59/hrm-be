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
import { IPaginationResponse } from '@/common/types/common.type';
import { EmployeeEntity } from './entities/employee.entity';
import UpdateEmployeeDto from './dto/update-employee.dto';
import UpdateEmployeeProfileDto from './dto/update-employee-profile.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('all')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  @ResponseMessage('Get all employees successful')
  async getAllEmployees(
    @Query() query: SearchEmployeeQueryDto,
    @User() actor: IUser,
  ): Promise<IPaginationResponse<EmployeeEntity>> {
    return this.employeesService.getAllEmployees(query, actor);
  }

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  @ResponseMessage('Create employee successful')
  async createEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.createEmployee(createEmployeeDto);
  }

  @Post(':id/provision-account')
  @Roles(Role.ADMIN, Role.HR)
  @ResponseMessage('Provision account successful')
  async provisionAccount(
    @Param('id', ParseIntPipe) employeeId: number,
    @Body() provisionAccountDto: ProvisionAccountDto,
  ) {
    return this.employeesService.provisionAccount(
      employeeId,
      provisionAccountDto,
    );
  }

  @Patch('/profile')
  @ResponseMessage('Update employee profile successful')
  async updateEmployeeProfile(
    @Body() updateEmployeeProfileDto: UpdateEmployeeProfileDto,
    @User() actor: IUser,
  ) {
    return this.employeesService.updateProfile(updateEmployeeProfileDto, actor);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.HR)
  @ResponseMessage('Update employee successful')
  async updateEmployee(
    @Param('id', ParseIntPipe) employeeId: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.updateEmployee(employeeId, updateEmployeeDto);
  }
}
