import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateLeaveRequestDto } from './create-leave-request.dto';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ELeaveRequestStatus } from '@/common/constants/leave-request.constant';

export class UpdateLeaveRequestStatusDto {
  @ApiProperty({
    example: ELeaveRequestStatus.APPROVED,
    enum: ELeaveRequestStatus,
  })
  @IsEnum(ELeaveRequestStatus)
  @IsNotEmpty()
  status: ELeaveRequestStatus;

  @ApiProperty({ example: 'Oke' })
  @IsString()
  note: string;
}

export class UpdateMyLeaveRequestDto extends PartialType(
  CreateLeaveRequestDto,
) {}
