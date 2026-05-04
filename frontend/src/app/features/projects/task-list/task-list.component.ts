import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../../shared/models';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [FormsModule, DatePipe, TaskModalComponent],
  template: `
    <div class="task-list-page">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="filters">
          <div class="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" [(ngModel)]="filters.search" (ngModelChange)="onFilterChange()" placeholder="Search tasks..." />
          </div>

          <select [(ngModel)]="filters.status" (ngModelChange)="onFilterChange()" class="filter-select">
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>

          <select [(ngModel)]="filters.priority" (ngModelChange)="onFilterChange()" class="filter-select">
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <button class="btn-primary" (click)="openCreate()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Task
        </button>
      </div>

      <!-- Task Table -->
      <div class="table-wrapper">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
          </div>
        } @else if (tasks().length === 0) {
          <div class="empty-state">
            <span>📋</span>
            <p>No tasks found. <button class="link-btn" (click)="openCreate()">Create one</button></p>
          </div>
        } @else {
          <table class="task-table">
            <thead>
              <tr>
                <th class="col-key">Key</th>
                <th class="col-title">Title</th>
                <th class="col-status">Status</th>
                <th class="col-priority">Priority</th>
                <th class="col-assignee">Assignee</th>
                <th class="col-due">Due Date</th>
                <th class="col-points">Points</th>
              </tr>
            </thead>
            <tbody>
              @for (task of tasks(); track task.id) {
                <tr class="task-row" (click)="openTask(task)">
                  <td class="col-key">
                    <span class="task-key">{{ task.projectKey }}-{{ task.id }}</span>
                  </td>
                  <td class="col-title">
                    <span class="task-title">{{ task.title }}</span>
                    @if (task.commentsCount > 0) {
                      <span class="comment-count">💬 {{ task.commentsCount }}</span>
                    }
                  </td>
                  <td class="col-status">
                    <span class="status-badge" [class]="task.status.toLowerCase()">
                      {{ statusLabels[task.status] }}
                    </span>
                  </td>
                  <td class="col-priority">
                    <span class="priority-badge" [class]="task.priority.toLowerCase()">
                      {{ task.priority }}
                    </span>
                  </td>
                  <td class="col-assignee">
                    @if (task.assignee) {
                      <div class="assignee-cell">
                        <div class="avatar-xs" [style.background]="getColor(task.assignee.id)">
                          {{ (task.assignee.fullName || task.assignee.username)[0].toUpperCase() }}
                        </div>
                        <span>{{ task.assignee.fullName || task.assignee.username }}</span>
                      </div>
                    } @else {
                      <span class="unassigned">—</span>
                    }
                  </td>
                  <td class="col-due">
                    @if (task.dueDate) {
                      <span [class.overdue]="isOverdue(task.dueDate) && task.status !== 'DONE'">
                        {{ task.dueDate | date:'MMM d' }}
                      </span>
                    } @else { <span class="unassigned">—</span> }
                  </td>
                  <td class="col-points">
                    @if (task.storyPoints) {
                      <span class="points-chip">{{ task.storyPoints }}</span>
                    } @else { <span class="unassigned">—</span> }
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pagination">
              <button [disabled]="currentPage() === 0" (click)="goToPage(currentPage() - 1)">← Prev</button>
              <span>Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
              <button [disabled]="currentPage() >= totalPages() - 1" (click)="goToPage(currentPage() + 1)">Next →</button>
            </div>
          }
        }
      </div>
    </div>

    @if (selectedTask()) {
      <app-task-modal
        [task]="selectedTask()!"
        [projectId]="projectId()"
        (closed)="selectedTask.set(null)"
        (updated)="onUpdated($event)"
        (deleted)="onDeleted($event)" />
    }

    @if (showCreate()) {
      <app-task-modal
        [projectId]="projectId()"
        (closed)="showCreate.set(false)"
        (created)="onCreated($event)" />
    }
  `,
  styles: [`
    .task-list-page { height: calc(100vh - 132px); display: flex; flex-direction: column; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: white; border-bottom: 1px solid #e2e8f0; gap: 1rem; }
    .filters { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .search-box { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.75rem; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; }
    .search-box input { border: none; outline: none; font-size: 0.875rem; background: transparent; width: 200px; }
    .filter-select { padding: 0.45rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; outline: none; background: white; cursor: pointer; color: #374151; }
    .btn-primary { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1.1rem; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.15s; }
    .btn-primary:hover { background: #4f46e5; }
    .table-wrapper { flex: 1; overflow: auto; padding: 1.25rem 1.5rem; }
    .task-table { width: 100%; border-collapse: separate; border-spacing: 0; background: white; border-radius: 12px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .task-table thead { background: #f8fafc; }
    .task-table th { padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
    .task-row { cursor: pointer; transition: background 0.1s; }
    .task-row:hover td { background: #f8fafc; }
    .task-table td { padding: 0.875rem 1rem; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
    .task-row:last-child td { border-bottom: none; }
    .task-key { font-size: 0.78rem; color: #94a3b8; font-weight: 500; font-family: monospace; }
    .task-title { font-size: 0.9rem; font-weight: 500; color: #1e293b; }
    .comment-count { font-size: 0.75rem; color: #94a3b8; margin-left: 0.5rem; }
    .col-key { width: 90px; }
    .col-status { width: 120px; }
    .col-priority { width: 100px; }
    .col-assignee { width: 160px; }
    .col-due { width: 100px; }
    .col-points { width: 70px; text-align: center; }
    .status-badge { display: inline-block; font-size: 0.78rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 6px; }
    .status-badge.todo { background: #eff6ff; color: #3b82f6; }
    .status-badge.in_progress { background: #fef3c7; color: #d97706; }
    .status-badge.done { background: #dcfce7; color: #16a34a; }
    .priority-badge { display: inline-block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .priority-badge.low { background: #dcfce7; color: #16a34a; }
    .priority-badge.medium { background: #fef3c7; color: #d97706; }
    .priority-badge.high { background: #fee2e2; color: #dc2626; }
    .priority-badge.critical { background: #dc2626; color: white; }
    .assignee-cell { display: flex; align-items: center; gap: 0.5rem; }
    .avatar-xs { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: white; flex-shrink: 0; }
    .assignee-cell span { font-size: 0.875rem; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px; }
    .unassigned { color: #cbd5e1; }
    .overdue { color: #ef4444; font-weight: 600; }
    .points-chip { display: inline-block; background: #eff6ff; color: #3b82f6; font-size: 0.78rem; font-weight: 600; padding: 0.2rem 0.45rem; border-radius: 5px; }
    .loading-state { display: flex; align-items: center; justify-content: center; padding: 4rem; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem; color: #94a3b8; }
    .empty-state span { font-size: 2.5rem; }
    .link-btn { background: none; border: none; color: #6366f1; cursor: pointer; font-size: inherit; padding: 0; font-weight: 500; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; }
    .pagination button { padding: 0.4rem 0.875rem; border: 1.5px solid #e2e8f0; border-radius: 7px; background: white; cursor: pointer; font-size: 0.85rem; font-weight: 500; color: #374151; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pagination span { font-size: 0.875rem; color: #64748b; }
  `]
})
export class TaskListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private notify = inject(NotificationService);

  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);
  readonly projectId = signal(0);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly selectedTask = signal<Task | null>(null);
  readonly showCreate = signal(false);

  filters = { search: '', status: '', priority: '' };
  private searchTimer: any;

  statusLabels: Record<string, string> = {
    TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done'
  };

  ngOnInit(): void {
    const id = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.projectId.set(id);
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.taskService.getTasks(this.projectId(), {
      status: this.filters.status || undefined,
      priority: this.filters.priority || undefined,
      search: this.filters.search || undefined,
      page: this.currentPage(),
      size: 25
    }).subscribe({
      next: res => {
        this.tasks.set(res.content);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage.set(0);
      this.loadTasks();
    }, 300);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadTasks();
  }

  openTask(task: Task): void { this.selectedTask.set(task); }
  openCreate(): void { this.showCreate.set(true); }

  onCreated(task: Task): void {
    this.showCreate.set(false);
    this.loadTasks();
    this.notify.success('Task created');
  }

  onUpdated(task: Task): void {
    this.selectedTask.set(null);
    this.loadTasks();
  }

  onDeleted(id: number): void {
    this.selectedTask.set(null);
    this.loadTasks();
    this.notify.success('Task deleted');
  }

  isOverdue(date: string): boolean { return new Date(date) < new Date(); }

  getColor(id: number): string {
    const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4'];
    return colors[id % colors.length];
  }
}
