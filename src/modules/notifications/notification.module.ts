import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { ConnectionManager } from './connection-manager.service';
import { NotificationService } from './notification.service';

@Module({
  imports: [],
  controllers: [NotificationController],
  providers: [ConnectionManager, NotificationService],
  exports: [NotificationService, ConnectionManager],
})
export class NotificationModule {}
