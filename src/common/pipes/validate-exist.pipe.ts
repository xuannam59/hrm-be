import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EEmployeeStatus } from '../constants/employee.constant';

@Injectable()
export class ExistEmployeeBodyPipe implements PipeTransform {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}
  async transform(value: any) {
    if (!value?.employeeId) {
      throw new BadRequestException('Employee ID is required');
    }

    const existsEmployee = await this.employeeRepository.exists({
      where: { id: value.employeeId, status: EEmployeeStatus.WORKING },
    });

    if (!existsEmployee) {
      throw new NotFoundException('Employee not found');
    }

    return value;
  }
}
