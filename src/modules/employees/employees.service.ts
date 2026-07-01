import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IUser } from '@/common/types/user.type';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prismaService: PrismaService,
  ) {}

  async createEmployee(createEmployeeDto: any) {}

  async updateEmployee(updateEmployeeDto: any, user: IUser) {}

  async getAllEmployees(query: any, user: IUser) {}
}
