import { ERole } from '@/common/constants/role.constant';
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
import { CreateEmployeeInsuranceDto } from './dto/create-employee-insurance.dto';
import { SearchEmployeeInsuranceQueryDto } from './dto/search-employee-insurance-query.dto';
import { UpdateEmployeeInsuranceDto } from './dto/update-employee-insurance.dto';
import { EmployeeInsuranceService } from './employee-insurance.service';

@Controller('employee-insurance')
export class EmployeeInsuranceController {
  constructor(
    private readonly employeeInsuranceService: EmployeeInsuranceService,
  ) {}

  @Post()
  @Roles(ERole.ADMIN)
  create(@Body() createEmployeeInsuranceDto: CreateEmployeeInsuranceDto) {
    return this.employeeInsuranceService.create(createEmployeeInsuranceDto);
  }

  @Get()
  @Roles(ERole.ADMIN)
  findAll(@Query() query: SearchEmployeeInsuranceQueryDto) {
    return this.employeeInsuranceService.findAll(query);
  }

  @Get(':id')
  @Roles(ERole.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeeInsuranceService.findOne(id);
  }

  @Patch(':id')
  @Roles(ERole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeInsuranceDto: UpdateEmployeeInsuranceDto,
  ) {
    return this.employeeInsuranceService.update(id, updateEmployeeInsuranceDto);
  }

  @Delete(':id')
  @Roles(ERole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeeInsuranceService.remove(id);
  }
}
