import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ProjectService } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Project } from '../../../shared/models';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Projects</h1>
          <p class="subtitle">{{ total() }} project{{ total() !== 1 ? 's' : '' }}</p>
        </div>
        <a routerLink="/projects/new" class="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Project
        </a>
      </header>

      <div class="toolbar">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="Search projects..." />
        </div>
        <div class="view-toggle">
          <button [class.active]="view() === 'grid'" (click)="view.set('grid')">⊞ Grid</button>
          <button [class.active]="view() === 'list'" (click)="view.set('list')">☰ List</button>
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton-grid">
          @for (i of [1,2,3,4,5,6]; track i) { <div class="skeleton-card"></div> }
        </div>
      } @else if (projects().length === 0) {
        <div class="empty-page">
          <div class="empty-icon">📁</div>
          <h2>No projects yet</h2>
          <p>Create your first project to start organizing work</p>
          <a routerLink="/projects/new" class="btn-primary">Create Project</a>
        </div>
      } @else {
        <div [class]="view() === 'grid' ? 'projects-grid' : 'projects-list'">
          @for (p of projects(); track p.id) {
            <div class="project-card" [class.list-card]="view() === 'list'">
              <div class="card-accent" [style.background]="p.color"></div>
              <div class="card-body">
                <div class="card-top">
                  <div class="project-key-badge" [style.color]="p.color">{{ p.key }}</div>
                  <span class="status-badge" [class]="p.status.toLowerCase()">{{ p.status }}</span>
                </div>
                <h3 class="project-name">{{ p.name }}</h3>
                @if (p.description) {
                  <p class="project-desc">{{ p.description }}</p>
                }
                <div class="card-footer">
                  <div class="member-stack">
                    @for (m of p.members.slice(0,4); track m.id) {
                      <div class="avatar-tiny" [style.background]="getAvatarColor(m.user.id)" [title]="m.user.fullName || m.user.username">
                        @if (m.user.avatarUrl) { <img [src]="m.user.avatarUrl" /> }
                        @else { {{ (m.user.fullName || m.user.username)[0].toUpperCase() }} }
                      </div>
                    }
                    @if (p.members.length > 4) {
                      <div class="avatar-tiny more">+{{ p.members.length - 4 }}</div>
                    }
                  </div>
                  <span class="task-count">{{ p.taskCount }} tasks</span>
                </div>
                <div class="card-actions">
                  <a [routerLink]="['/projects', p.id, 'board']" class="btn-secondary">Open Board</a>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem; }
    .subtitle { color: #64748b; margin: 0; }
    .btn-primary {
      display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.25rem;
      background: #6366f1; color: white; border-radius: 8px; text-decoration: none;
      font-weight: 600; font-size: 0.9rem; transition: all 0.15s; border: none; cursor: pointer;
    }
    .btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }
    .btn-secondary {
      padding: 0.45rem 0.875rem; background: #f1f5f9; color: #374151; border-radius: 6px;
      text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: all 0.15s;
    }
    .btn-secondary:hover { background: #e2e8f0; }
    .toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .search-box {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.875rem;
      background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; flex: 1; max-width: 360px;
    }
    .search-box input { border: none; outline: none; font-size: 0.9rem; width: 100%; }
    .view-toggle { display: flex; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .view-toggle button { padding: 0.45rem 0.875rem; border: none; background: none; cursor: pointer; font-size: 0.85rem; color: #64748b; }
    .view-toggle button.active { background: #f1f5f9; color: #1e293b; font-weight: 500; }
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }
    .projects-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .project-card {
      background: white; border-radius: 12px; overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;
      transition: all 0.2s; position: relative;
    }
    .project-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .list-card { display: flex; flex-direction: row; }
    .card-accent { height: 4px; }
    .list-card .card-accent { width: 4px; height: auto; }
    .card-body { padding: 1.25rem; flex: 1; }
    .card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
    .project-key-badge { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; }
    .status-badge { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .status-badge.active { background: #dcfce7; color: #16a34a; }
    .status-badge.archived { background: #f1f5f9; color: #64748b; }
    .project-name { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0 0 0.4rem; }
    .project-desc { font-size: 0.85rem; color: #64748b; margin: 0 0 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-footer { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.875rem; }
    .member-stack { display: flex; }
    .avatar-tiny {
      width: 26px; height: 26px; border-radius: 50%; background: #6366f1;
      display: flex; align-items: center; justify-content: center; font-size: 0.65rem;
      font-weight: 700; color: white; border: 2px solid white; margin-left: -6px; overflow: hidden;
    }
    .avatar-tiny:first-child { margin-left: 0; }
    .avatar-tiny img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-tiny.more { background: #e2e8f0; color: #64748b; }
    .task-count { font-size: 0.8rem; color: #94a3b8; }
    .card-actions { display: flex; gap: 0.5rem; }
    .empty-page { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem 2rem; text-align: center; }
    .empty-icon { font-size: 4rem; }
    .empty-page h2 { font-size: 1.4rem; font-weight: 600; color: #1e293b; margin: 0; }
    .empty-page p { color: #64748b; margin: 0; }
    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }
    .skeleton-card { height: 200px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
    @keyframes shimmer { to { background-position: -200% 0; } }
  `]
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);

  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly view = signal<'grid' | 'list'>('grid');
  search = '';
  private searchTimer: any;

  ngOnInit(): void { this.loadProjects(); }

  loadProjects(): void {
    this.loading.set(true);
    this.projectService.getProjects(this.search || undefined).subscribe({
      next: res => {
        this.projects.set(res.content);
        this.total.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadProjects(), 350);
  }

  getAvatarColor(id: number): string {
    const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4'];
    return colors[id % colors.length];
  }
}
