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
import { EmployeeBenefitService } from './employee-benefit.service';
import { CreateEmployeeBenefitDto } from './dto/create-employee-benefit.dto';
import { UpdateEmployeeBenefitDto } from './dto/update-employee-benefit.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { ERole } from '@/common/constants/role.constant';
import { User } from '@/common/decorators/user.decorator';
import type { IUser } from '@/common/types/user.type';
import { SearchEmployeeBenefitQueryDto } from './dto/search-employee-benefit-query.dto';

@Controller('employee-benefit')
export class EmployeeBenefitController {
  constructor(
    private readonly employeeBenefitService: EmployeeBenefitService,
  ) {}

  @Post()
  @Roles(ERole.ADMIN)
  create(@Body() createEmployeeBenefitDto: CreateEmployeeBenefitDto) {
    return this.employeeBenefitService.create(createEmployeeBenefitDto);
  }

  @Get()
  @Roles(ERole.ADMIN)
  findAll(
    @Query() searchEmployeeBenefitQueryDto: SearchEmployeeBenefitQueryDto,
  ) {
    return this.employeeBenefitService.findAll(searchEmployeeBenefitQueryDto);
  }

  @Get(':id')
  @Roles(ERole.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeeBenefitService.findOne(id);
  }

  @Get('me')
  findMy(@User() actor: IUser) {
    return this.employeeBenefitService.findMy(actor);
  }

  @Patch(':id')
  @Roles(ERole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeBenefitDto: UpdateEmployeeBenefitDto,
  ) {
    return this.employeeBenefitService.update(id, updateEmployeeBenefitDto);
  }

  @Delete(':id')
  @Roles(ERole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeeBenefitService.remove(id);
  }
}
