import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  template: `
    <div class="notifications-container">
      @for (n of notify.notifications(); track n.id) {
        <div class="toast" [class]="n.type" (click)="notify.dismiss(n.id)">
          <span class="toast-icon">{{ icons[n.type] }}</span>
          <span class="toast-msg">{{ n.message }}</span>
          <button class="toast-close">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed; bottom: 1.5rem; right: 1.5rem;
      display: flex; flex-direction: column; gap: 0.6rem;
      z-index: 9999; max-width: 360px;
    }
    .toast {
      display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1rem;
      border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.12);
      cursor: pointer; animation: slideIn 0.25s ease;
      font-size: 0.9rem; font-weight: 500;
    }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .toast.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
    .toast.error   { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
    .toast.info    { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; }
    .toast.warning { background: #fffbeb; border: 1px solid #fed7aa; color: #d97706; }
    .toast-icon { font-size: 1.1rem; }
    .toast-msg { flex: 1; }
    .toast-close { background: none; border: none; font-size: 1.1rem; cursor: pointer; opacity: 0.6; padding: 0; line-height: 1; }
  `]
})
export class NotificationsComponent {
  notify = inject(NotificationService);
  icons: Record<string, string> = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
}
