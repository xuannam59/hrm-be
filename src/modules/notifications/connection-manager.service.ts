import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

interface SseMessage {
  data: any;
}

@Injectable()
export class ConnectionManager {
  private readonly connections = new Map<number, Set<Subject<SseMessage>>>();

  add(userId: number, subject: Subject<SseMessage>) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(subject);

    console.log('New connection added for user', userId);
  }

  remove(userId: number, subject: Subject<SseMessage>) {
    const subjects = this.connections.get(userId);

    if (!subjects) return;

    subjects.delete(subject);

    if (subjects.size === 0) {
      this.connections.delete(userId);
    }

    console.log('Connection removed for user', userId);
  }

  send(userId: number, payload: any) {
    const subjects = this.connections.get(userId);

    if (!subjects) return;

    for (const subject of subjects) {
      subject.next({ data: payload });
    }
  }

  broadcast(payload: any) {
    for (const subjects of this.connections.values()) {
      for (const subject of subjects) {
        subject.next({ data: payload });
      }
    }
  }
}
