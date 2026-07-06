import { Injectable } from '@nestjs/common';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { IUser } from '@/common/types/user.type';

@Injectable()
export class LeaveRequestsService {
  create(createLeaveRequestDto: CreateLeaveRequestDto) {
    return 'This action adds a new leaveRequest';
  }

  findAll() {
    return `This action returns all leaveRequests`;
  }

  getMyLeaveRequests(actor: IUser) {
    return 'This action returns my leave requests';
  }

  update(id: number, updateLeaveRequestDto: UpdateLeaveRequestDto) {
    return `This action updates a #${id} leaveRequest`;
  }

  updateStatus(id: number, updateLeaveRequestDto: UpdateLeaveRequestDto) {
    return `This action updates the status of a #${id} leaveRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} leaveRequest`;
  }
}
