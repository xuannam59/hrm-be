import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ResponseMessage } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ERole } from '@/common/constants/role.constant';
import SearchDepartmentQueryDto from './dto/search-department-query.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(ERole.ADMIN)
  @ResponseMessage('Create department successful')
  async createDepartment(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.createDepartment(createDepartmentDto);
  }

  @Get()
  @Roles(ERole.ADMIN)
  @ResponseMessage('Get all departments successful')
  async getAllDepartments(@Query() query: SearchDepartmentQueryDto) {
    return this.departmentsService.getAllDepartments(query);
  }

  @Patch(':id')
  @Roles(ERole.ADMIN)
  @ResponseMessage('Update department successful')
  async updateDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.updateDepartment(id, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles(ERole.ADMIN)
  @ResponseMessage('Delete department successful')
  async removeDepartment(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.removeDepartment(id);
  }
}
