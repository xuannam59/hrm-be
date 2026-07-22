import { ERole } from '@/common/constants/user.constant';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { EntityExistPipe } from '@/common/pipes/validate-exist.pipe';
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
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { CreateEmployeeEducationDto } from './dto/create-employee-education.dto';
import { SearchEmployeeEducationQueryDto } from './dto/search-employee-education-query.dto';
import { UpdateEmployeeEducationDto } from './dto/update-employee-education.dto';
import { EmployeeEducationsService } from './employee-educations.service';
import { EmployeeEducationEntity } from './entities/employee-education.entity';

@Controller('employee-educations')
export class EmployeeEducationsController {
  constructor(
    private readonly employeeEducationsService: EmployeeEducationsService,
  ) {}

  @Post()
  @Roles(ERole.ADMIN)
  create(
    @Body(EntityExistPipe(EmployeeEntity, 'employeeId'))
    createEmployeeEducationDto: CreateEmployeeEducationDto,
  ) {
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
    @Param('id', EntityExistPipe(EmployeeEducationEntity, 'id'))
    educationId: number,
    @Body() updateEmployeeEducationDto: UpdateEmployeeEducationDto,
  ) {
    return this.employeeEducationsService.update(
      educationId,
      updateEmployeeEducationDto,
    );
  }

  @Delete(':id')
  @Roles(ERole.ADMIN)
  remove(
    @Param('id', EntityExistPipe(EmployeeEducationEntity, 'id')) id: number,
  ) {
    return this.employeeEducationsService.remove(id);
  }
}
