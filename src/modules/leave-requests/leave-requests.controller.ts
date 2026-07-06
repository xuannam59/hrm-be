import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { User } from '@/common/decorators/user.decorator';
import type { IUser } from '@/common/types/user.type';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/constants/role.constant';

@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Post()
  create(@Body() createLeaveRequestDto: CreateLeaveRequestDto) {
    return this.leaveRequestsService.create(createLeaveRequestDto);
  }

  @Get()
  findAll() {
    return this.leaveRequestsService.findAll();
  }

  @Get('me')
  getMyLeaveRequests(@User() actor: IUser) {
    return this.leaveRequestsService.getMyLeaveRequests(actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLeaveRequestDto: UpdateLeaveRequestDto,
  ) {
    return this.leaveRequestsService.update(+id, updateLeaveRequestDto);
  }

  @Patch(':id/status')
  @Roles(Role.MANAGER)
  updateStatus(
    @Param('id') id: string,
    @Body() updateLeaveRequestStatusDto: any,
  ) {
    return this.leaveRequestsService.updateStatus(
      +id,
      updateLeaveRequestStatusDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaveRequestsService.remove(+id);
  }
}
