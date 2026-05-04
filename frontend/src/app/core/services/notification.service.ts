import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<Notification[]>([]);

  success(message: string, duration = 4000): void {
    this.add({ type: 'success', message }, duration);
  }

  error(message: string, duration = 6000): void {
    this.add({ type: 'error', message }, duration);
  }

  info(message: string, duration = 4000): void {
    this.add({ type: 'info', message }, duration);
  }

  warning(message: string, duration = 5000): void {
    this.add({ type: 'warning', message }, duration);
  }

  dismiss(id: string): void {
    this.notifications.update(n => n.filter(x => x.id !== id));
  }

  private add(notification: Omit<Notification, 'id'>, duration: number): void {
    const id = crypto.randomUUID();
    this.notifications.update(n => [...n, { ...notification, id }]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }
}
