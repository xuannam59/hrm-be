import { Module } from '@nestjs/common';
import { EmployeeHistoriesService } from './employee-histories.service';
import { EmployeeHistoriesController } from './employee-histories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmploymentHistoryEntity } from './entities/employment-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmploymentHistoryEntity])],
  controllers: [EmployeeHistoriesController],
  providers: [EmployeeHistoriesService],
})
export class EmployeeHistoriesModule {}
