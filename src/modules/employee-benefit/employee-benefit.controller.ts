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
import { CreateEmployeeBenefitDto } from './dto/create-employee-benefit.dto';
import { SearchEmployeeBenefitQueryDto } from './dto/search-employee-benefit-query.dto';
import { UpdateEmployeeBenefitDto } from './dto/update-employee-benefit.dto';
import { EmployeeBenefitService } from './employee-benefit.service';
import { ExistEmployeeBodyPipe } from '@/common/pipes/validate-exist.pipe';

@Controller('employee-benefit')
export class EmployeeBenefitController {
  constructor(
    private readonly employeeBenefitService: EmployeeBenefitService,
  ) {}

  @Post()
  @Roles(ERole.ADMIN)
  create(
    @Body(ExistEmployeeBodyPipe)
    createEmployeeBenefitDto: CreateEmployeeBenefitDto,
  ) {
    return this.employeeBenefitService.create(createEmployeeBenefitDto);
  }

  @Get()
  @Roles(ERole.ADMIN)
  findAll(
    @Query() searchEmployeeBenefitQueryDto: SearchEmployeeBenefitQueryDto,
  ) {
    return this.employeeBenefitService.findAll(searchEmployeeBenefitQueryDto);
  }

  @Get('me')
  findMy(@User() actor: IUser) {
    return this.employeeBenefitService.findMy(actor);
  }

  @Get(':id')
  @Roles(ERole.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeeBenefitService.findOne(id);
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
