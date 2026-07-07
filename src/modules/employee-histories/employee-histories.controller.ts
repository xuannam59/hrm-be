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
import { EmployeeHistoriesService } from './employee-histories.service';
import { CreateEmployeeHistoryDto } from './dto/create-employee-history.dto';
import { UpdateEmployeeHistoryDto } from './dto/update-employee-history.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { ERole } from '@/common/constants/role.constant';
import SearchHistoryQueryDto from './dto/search-history-query.dto';

@Controller('employee-histories')
export class EmployeeHistoriesController {
  constructor(
    private readonly employeeHistoriesService: EmployeeHistoriesService,
  ) {}

  @Post()
  @Roles(ERole.ADMIN)
  create(@Body() createEmployeeHistoryDto: CreateEmployeeHistoryDto) {
    return this.employeeHistoriesService.create(createEmployeeHistoryDto);
  }

  @Get()
  @Roles(ERole.ADMIN)
  findAll(@Query() query: SearchHistoryQueryDto) {
    return this.employeeHistoriesService.findAll(query);
  }

  @Get(':id')
  @Roles(ERole.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeeHistoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(ERole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeHistoryDto: UpdateEmployeeHistoryDto,
  ) {
    return this.employeeHistoriesService.update(id, updateEmployeeHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeeHistoriesService.remove(id);
  }
}
