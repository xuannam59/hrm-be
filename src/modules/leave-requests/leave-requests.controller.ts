import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { ERole } from '@/common/constants/user.constant';
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
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import {
  SearchLeaveQueryDto,
  SearchMyLeaveQueryDto,
} from './dto/search-leave-query.dto';
import {
  UpdateLeaveRequestStatusDto,
  UpdateMyLeaveRequestDto,
} from './dto/update-leave-request.dto';
import { LeaveRequestsService } from './leave-requests.service';

@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Post()
  @Roles(ERole.EMPLOYEE, ERole.MANAGER)
  create(
    @Body() createLeaveRequestDto: CreateLeaveRequestDto,
    @User() actor: IUser,
  ) {
    return this.leaveRequestsService.create(createLeaveRequestDto, actor);
  }

  @Get()
  @Roles(ERole.MANAGER, ERole.ADMIN)
  findAll(
    @Query() searchLeaveQueryDto: SearchLeaveQueryDto,
    @User() actor: IUser,
  ) {
    return this.leaveRequestsService.findAll(searchLeaveQueryDto, actor);
  }

  @Get('me')
  getMyLeaveRequests(
    @Query() searchLeaveQueryDto: SearchMyLeaveQueryDto,
    @User() actor: IUser,
  ) {
    return this.leaveRequestsService.getMyLeaveRequests(
      searchLeaveQueryDto,
      actor,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @User() actor: IUser) {
    return this.leaveRequestsService.findOne(id, actor);
  }

  @Patch(':id')
  @Roles(ERole.EMPLOYEE, ERole.MANAGER)
  updateMyRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeaveRequestDto: UpdateMyLeaveRequestDto,
    @User() actor: IUser,
  ) {
    return this.leaveRequestsService.updateMyRequest(
      id,
      updateLeaveRequestDto,
      actor,
    );
  }

  @Patch(':id/status')
  @Roles(ERole.MANAGER, ERole.ADMIN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeaveRequestStatusDto: UpdateLeaveRequestStatusDto,
    @User() actor: IUser,
  ) {
    return this.leaveRequestsService.updateStatus(
      id,
      updateLeaveRequestStatusDto,
      actor,
    );
  }

  @Delete(':id')
  @Roles(ERole.MANAGER, ERole.EMPLOYEE)
  remove(@Param('id', ParseIntPipe) id: number, @User() actor: IUser) {
    return this.leaveRequestsService.remove(id, actor);
  }
}
