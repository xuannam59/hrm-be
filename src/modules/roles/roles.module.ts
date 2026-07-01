import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '@/common/guards/roles.guard';

@Module({
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
