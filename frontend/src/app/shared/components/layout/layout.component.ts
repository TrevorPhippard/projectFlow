import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationsComponent } from '../notifications/notifications.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationsComponent],
  template: `
    <div class="app-shell" [class.sidebar-collapsed]="collapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="14" fill="#6366f1"/>
              <path d="M14 20h12v4H14zM14 28h28v4H14zM14 36h20v4H14z" fill="white"/>
              <rect x="30" y="14" width="12" height="12" rx="2" fill="#a5f3fc"/>
            </svg>
            @if (!collapsed()) { <span class="logo-text">ProjectFlow</span> }
          </div>
          <button class="collapse-btn" (click)="collapsed.set(!collapsed())">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @if (collapsed()) {
                <path d="M9 18l6-6-6-6"/>
              } @else {
                <path d="M15 18l-6-6 6-6"/>
              }
            </svg>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" [title]="collapsed() ? 'Dashboard' : ''">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            @if (!collapsed()) { <span>Dashboard</span> }
          </a>
          <a routerLink="/projects" routerLinkActive="active" class="nav-item" [title]="collapsed() ? 'Projects' : ''">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            @if (!collapsed()) { <span>Projects</span> }
          </a>
          <a routerLink="/tasks" routerLinkActive="active" class="nav-item" [title]="collapsed() ? 'My Tasks' : ''">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            @if (!collapsed()) { <span>My Tasks</span> }
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/profile" class="user-card" [title]="collapsed() ? user()?.fullName || '' : ''">
            <div class="avatar-sm">
              @if (user()?.avatarUrl) {
                <img [src]="user()!.avatarUrl" [alt]="user()?.fullName || ''" />
              } @else {
                {{ userInitial() }}
              }
            </div>
            @if (!collapsed()) {
              <div class="user-info">
                <span class="user-name">{{ user()?.fullName || user()?.username }}</span>
                <span class="user-email">{{ user()?.email }}</span>
              </div>
            }
          </a>
          <button class="logout-btn" (click)="logout()" [title]="'Logout'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="main-content">
        <router-outlet />
      </main>
    </div>

    <app-notifications />
  `,
  styles: [`
    .app-shell {
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: 100vh;
      transition: grid-template-columns 0.25s;
    }
    .app-shell.sidebar-collapsed { grid-template-columns: 68px 1fr; }
    .sidebar {
      background: #0f172a;
      color: white;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: hidden;
    }
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .logo { display: flex; align-items: center; gap: 0.75rem; overflow: hidden; }
    .logo-text { font-size: 1.1rem; font-weight: 700; white-space: nowrap; }
    .collapse-btn {
      background: none; border: none; color: rgba(255,255,255,0.4);
      cursor: pointer; padding: 0.25rem; border-radius: 6px;
      display: flex; transition: color 0.15s;
    }
    .collapse-btn:hover { color: white; }
    .sidebar-nav { flex: 1; padding: 1rem 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.75rem;
      border-radius: 8px; color: rgba(255,255,255,0.6); text-decoration: none;
      font-size: 0.9rem; font-weight: 500; transition: all 0.15s; white-space: nowrap; overflow: hidden;
    }
    .nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
    .nav-item.active { background: rgba(99,102,241,0.25); color: #a5b4fc; }
    .nav-item svg { flex-shrink: 0; }
    .sidebar-footer {
      padding: 1rem 0.75rem;
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex; align-items: center; gap: 0.5rem;
    }
    .user-card {
      display: flex; align-items: center; gap: 0.75rem; flex: 1;
      text-decoration: none; overflow: hidden; border-radius: 8px;
      padding: 0.5rem; transition: background 0.15s;
    }
    .user-card:hover { background: rgba(255,255,255,0.06); }
    .avatar-sm {
      width: 34px; height: 34px; border-radius: 50%; background: #6366f1;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; color: white; flex-shrink: 0; overflow: hidden;
    }
    .avatar-sm img { width: 100%; height: 100%; object-fit: cover; }
    .user-info { overflow: hidden; }
    .user-name { display: block; font-size: 0.85rem; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-email { display: block; font-size: 0.75rem; color: rgba(255,255,255,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .logout-btn {
      background: none; border: none; color: rgba(255,255,255,0.4);
      cursor: pointer; padding: 0.4rem; border-radius: 6px;
      display: flex; transition: color 0.15s; flex-shrink: 0;
    }
    .logout-btn:hover { color: #f87171; }
    .main-content { background: #f8fafc; overflow-y: auto; min-height: 100vh; }
  `]
})
export class LayoutComponent {
  private authState = inject(AuthStateService);
  private authService = inject(AuthService);

  readonly user = this.authState.user;
  readonly collapsed = signal(false);

  userInitial(): string {
    const u = this.user();
    return (u?.fullName || u?.username || '?')[0].toUpperCase();
  }

  logout(): void {
    this.authService.logout().subscribe({ error: () => this.authState.logout() });
  }
}
