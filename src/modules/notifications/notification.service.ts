import { Injectable } from '@nestjs/common';
import { ConnectionManager } from './connection-manager.service';

@Injectable()
export class NotificationService {
  constructor(private readonly connectionManager: ConnectionManager) {}

  send(userId: number, data: any) {
    this.connectionManager.send(userId, data);
  }

  sendAll(data: any) {
    this.connectionManager.broadcast(data);
  }
}
