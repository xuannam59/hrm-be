import { ERole } from '@/common/constants/user.constant';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { type IUser } from '@/common/types/user.type';
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
import { CreateEmployeeEducationDto } from './dto/create-employee-education.dto';
import { SearchEmployeeEducationQueryDto } from './dto/search-employee-education-query.dto';
import { UpdateEmployeeEducationDto } from './dto/update-employee-education.dto';
import { EmployeeEducationsService } from './employee-educations.service';

@Controller('employee-educations')
export class EmployeeEducationsController {
  constructor(
    private readonly employeeEducationsService: EmployeeEducationsService,
  ) {}

  @Post()
  @Roles(ERole.ADMIN)
  create(@Body() createEmployeeEducationDto: CreateEmployeeEducationDto) {
    return this.employeeEducationsService.create(createEmployeeEducationDto);
  }

  @Get()
  @Roles(ERole.ADMIN, ERole.MANAGER)
  findAll(
    @Query() searchEmployeeEducationQueryDto: SearchEmployeeEducationQueryDto,
    @User() actor: IUser,
  ) {
    return this.employeeEducationsService.findAll(
      searchEmployeeEducationQueryDto,
      actor,
    );
  }

  @Get('me')
  findMyEducations(@User() actor: IUser) {
    return this.employeeEducationsService.findMyEducations(actor);
  }

  @Get(':id')
  @Roles(ERole.ADMIN, ERole.MANAGER)
  findOne(@Param('id', ParseIntPipe) id: number, @User() actor: IUser) {
    return this.employeeEducationsService.findOne(id, actor);
  }

  @Patch(':id')
  @Roles(ERole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeEducationDto: UpdateEmployeeEducationDto,
    @User() actor: IUser,
  ) {
    return this.employeeEducationsService.update(
      id,
      updateEmployeeEducationDto,
      actor,
    );
  }

  @Delete(':id')
  @Roles(ERole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeeEducationsService.remove(id);
  }
}
