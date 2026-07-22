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
import { CreateEmployeeHistoryDto } from './dto/create-employee-history.dto';
import SearchHistoryQueryDto from './dto/search-history-query.dto';
import { UpdateEmployeeHistoryDto } from './dto/update-employee-history.dto';
import { EmployeeHistoriesService } from './employee-histories.service';
import { ExistEmployeeBodyPipe } from '@/common/pipes/validate-exist.pipe';

@Controller('employee-histories')
export class EmployeeHistoriesController {
  constructor(
    private readonly employeeHistoriesService: EmployeeHistoriesService,
  ) {}

  @Post()
  @Roles(ERole.ADMIN)
  create(
    @Body(ExistEmployeeBodyPipe)
    createEmployeeHistoryDto: CreateEmployeeHistoryDto,
  ) {
    return this.employeeHistoriesService.create(createEmployeeHistoryDto);
  }

  @Get()
  @Roles(ERole.ADMIN)
  findAll(@Query() query: SearchHistoryQueryDto) {
    return this.employeeHistoriesService.findAll(query);
  }

  @Get('me')
  getMyHistories(@User() actor: IUser) {
    return this.employeeHistoriesService.getMyHistories(actor);
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
  @Roles(ERole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeeHistoriesService.remove(id);
  }
}
