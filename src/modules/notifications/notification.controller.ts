import { User } from '@/common/decorators/user.decorator';
import type { IUser } from '@/common/types/user.type';
import { Controller, MessageEvent, Req, Sse } from '@nestjs/common';
import type { Request } from 'express';
import { Observable, Subject } from 'rxjs';
import { ConnectionManager } from './connection-manager.service';
import { ERole } from '@/common/constants/user.constant';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly connectionManager: ConnectionManager) {}

  @Roles(ERole.ADMIN)
  @Sse('login')
  stream(@Req() req: Request, @User() user: IUser): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    this.connectionManager.add(user.id, subject);

    req.on('close', () => {
      console.log('Connection closed');

      subject.complete();
      this.connectionManager.remove(user.id, subject);
    });

    return subject.asObservable();
  }
}
