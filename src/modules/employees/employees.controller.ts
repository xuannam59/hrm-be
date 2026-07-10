import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseFilePipeBuilder,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { ERole } from '@/common/constants/role.constant';
import { Public, ResponseMessage } from '@/common/decorators/public.decorator';
import type { IUser } from '@/common/types/user.type';
import { User } from '@/common/decorators/user.decorator';
import SearchEmployeeQueryDto from './dto/search-employee-query.dto';
import CreateEmployeeDto from './dto/create-employee.dto';
import ProvisionAccountDto from '@/modules/users/dto/provision-account.dto';
import { IPaginationResponse } from '@/common/types/common.type';
import { EmployeeEntity } from './entities/employee.entity';
import UpdateEmployeeDto from './dto/update-employee.dto';
import UpdateEmployeeProfileDto from './dto/update-employee-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ALLOWED_FILE_EMPLOYEES_IMPORT,
  MAX_FILE_SIZE,
} from '@/common/constants/file.constant';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('')
  @Roles(ERole.ADMIN, ERole.MANAGER)
  @ResponseMessage('Get all employees successful')
  async getAllEmployees(
    @Query() query: SearchEmployeeQueryDto,
    @User() actor: IUser,
  ): Promise<IPaginationResponse<EmployeeEntity>> {
    return this.employeesService.getAllEmployees(query, actor);
  }

  @Get('me')
  @Roles(ERole.EMPLOYEE, ERole.MANAGER)
  @ResponseMessage('Get my employee profile successful')
  async getMyEmployeeProfile(@User() actor: IUser) {
    return this.employeesService.getMyEmployeeProfile(actor);
  }

  @Post()
  @Roles(ERole.ADMIN)
  @ResponseMessage('Create employee successful')
  async createEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.createEmployee(createEmployeeDto);
  }

  @Post(':id/provision-account')
  @Roles(ERole.ADMIN)
  @ResponseMessage('Provision account successful')
  async provisionAccount(
    @Param('id', ParseIntPipe) employeeId: number,
    @Body() provisionAccountDto: ProvisionAccountDto,
  ) {
    return this.employeesService.provisionAccount(
      employeeId,
      provisionAccountDto,
    );
  }

  @Patch('/profile')
  @ResponseMessage('Update employee profile successful')
  async updateEmployeeProfile(
    @Body() updateEmployeeProfileDto: UpdateEmployeeProfileDto,
    @User() actor: IUser,
  ) {
    return this.employeesService.updateProfile(updateEmployeeProfileDto, actor);
  }

  @Patch(':id')
  @Roles(ERole.ADMIN)
  @ResponseMessage('Update employee successful')
  async updateEmployee(
    @Param('id', ParseIntPipe) employeeId: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.updateEmployee(employeeId, updateEmployeeDto);
  }

  @Post('import')
  // @Roles(ERole.ADMIN)
  @Public()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importEmployees(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: MAX_FILE_SIZE,
          errorMessage: 'File must be less than 5MB',
        })
        .addFileTypeValidator({
          fileType: ALLOWED_FILE_EMPLOYEES_IMPORT,
          fallbackToMimetype: true,
          errorMessage: 'File must be a CSV or XLSX file',
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.employeesService.importEmployees(file);
  }
}
