import { ERole } from '@/common/constants/role.constant';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import type { IUser } from '@/common/types/user.type';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CalculatePayrollDto } from './dto/calculate-payroll.dto';
import { SearchPayrollQueryDto } from './dto/search-payroll-query.dto';
import { PayrollsService } from './payrolls.service';

@Controller('payrolls')
export class PayrollsController {
  constructor(private readonly payrollsService: PayrollsService) {}

  @Post()
  @Roles(ERole.ADMIN)
  calculatePayroll(@Body() calculatePayrollDto: CalculatePayrollDto) {
    return this.payrollsService.calculatePayroll(calculatePayrollDto);
  }

  @Get()
  @Roles(ERole.ADMIN)
  findAll(@Query() query: SearchPayrollQueryDto) {
    return this.payrollsService.findAll(query);
  }

  @Get('me')
  findMy(@User() actor: IUser) {
    return this.payrollsService.findMy(actor);
  }
}
