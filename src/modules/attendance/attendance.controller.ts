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
import { AttendanceService } from './attendance.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/constants/role.constant';
import { ResponseMessage } from '@/common/decorators/public.decorator';
import { User } from '@/common/decorators/user.decorator';
import type { IUser } from '@/common/types/user.type';
import {
  SearchAttendanceQueryDto,
  SearchMyAttendanceQueryDto,
} from './dto/sreach-attendance-query.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles(Role.EMPLOYEE, Role.MANAGER)
  @ResponseMessage('Check time successfully')
  async checkIn(@User() actor: IUser) {
    return this.attendanceService.checkIn(actor);
  }

  @Post('check-out')
  @Roles(Role.EMPLOYEE, Role.MANAGER)
  @ResponseMessage('Check time successfully')
  async checkOut(@User() actor: IUser) {
    return this.attendanceService.checkOut(actor);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ResponseMessage('Get attendance list successful')
  findAll(@Query() query: SearchAttendanceQueryDto, @User() actor: IUser) {
    return this.attendanceService.findAll(query, actor);
  }

  @Get('me')
  @ResponseMessage('Get attendance successfully')
  @Roles(Role.EMPLOYEE, Role.MANAGER)
  async getMyAttendance(
    @Query() query: SearchMyAttendanceQueryDto,
    @User() actor: IUser,
  ) {
    return this.attendanceService.getMyAttendance(query, actor);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ResponseMessage('Update attendance successfully')
  async updateAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAttendanceDto,
    @User() actor: IUser,
  ) {
    return this.attendanceService.updateAttendance(id, body, actor);
  }
}
