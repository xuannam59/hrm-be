import { ERole } from '@/common/constants/user.constant';
import { ResponseMessage } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { type IUser } from '@/common/types/user.type';
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
import {
  SearchAttendanceQueryDto,
  SearchMyAttendanceQueryDto,
} from './dto/sreach-attendance-query.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles(ERole.EMPLOYEE, ERole.MANAGER)
  @ResponseMessage('Check time successfully')
  async checkIn(@User() actor: IUser) {
    return this.attendanceService.checkIn(actor);
  }

  @Post('check-out')
  @Roles(ERole.EMPLOYEE, ERole.MANAGER)
  @ResponseMessage('Check time successfully')
  async checkOut(@User() actor: IUser) {
    return this.attendanceService.checkOut(actor);
  }

  @Get()
  @Roles(ERole.ADMIN, ERole.MANAGER)
  @ResponseMessage('Get attendance list successful')
  findAll(@Query() query: SearchAttendanceQueryDto, @User() actor: IUser) {
    return this.attendanceService.findAll(query, actor);
  }

  @Get('me')
  @ResponseMessage('Get attendance successfully')
  @Roles(ERole.EMPLOYEE, ERole.MANAGER)
  async getMyAttendance(
    @Query() query: SearchMyAttendanceQueryDto,
    @User() actor: IUser,
  ) {
    return this.attendanceService.getMyAttendance(query, actor);
  }

  @Patch(':id')
  @Roles(ERole.ADMIN)
  @ResponseMessage('Update attendance successfully')
  async updateAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAttendanceDto,
    @User() actor: IUser,
  ) {
    return this.attendanceService.updateAttendance(id, body, actor);
  }
}
