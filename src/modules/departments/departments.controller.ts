import { ERole } from '@/common/constants/user.constant';
import { ResponseMessage } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import SearchDepartmentQueryDto from './dto/search-department-query.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(ERole.ADMIN)
  @ResponseMessage('Create department successful')
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.createDepartment(createDepartmentDto);
  }

  @Get()
  @Roles(ERole.ADMIN)
  @ResponseMessage('Get all departments successful')
  async getAl(@Query() query: SearchDepartmentQueryDto) {
    return this.departmentsService.getAllDepartments(query);
  }

  @Patch(':id')
  @Roles(ERole.ADMIN)
  @ResponseMessage('Update department successful')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.updateDepartment(id, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles(ERole.ADMIN)
  @ResponseMessage('Delete department successful')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.removeDepartment(id);
  }
}
