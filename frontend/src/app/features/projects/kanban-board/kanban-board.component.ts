import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Task, TaskStatus } from '../../../shared/models';
import { TaskModalComponent } from '../task-modal/task-modal.component';

interface Column { id: TaskStatus; label: string; color: string; tasks: Task[]; }

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [DragDropModule, DatePipe, FormsModule, TaskModalComponent],
  template: `
    <div class="board-container">
      <div class="board-toolbar">
        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="filterTasks()" placeholder="Filter tasks..." />
        </div>
        <button class="btn-add" (click)="openCreateModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Task
        </button>
      </div>

      @if (loading()) {
        <div class="board-loading">
          <div class="spinner-lg"></div>
        </div>
      } @else {
        <div class="kanban-board" cdkDropListGroup>
          @for (col of columns(); track col.id) {
            <div class="kanban-column">
              <div class="column-header" [style.border-top-color]="col.color">
                <div class="column-title-row">
                  <span class="column-dot" [style.background]="col.color"></span>
                  <h3 class="column-title">{{ col.label }}</h3>
                  <span class="column-count">{{ col.tasks.length }}</span>
                </div>
                <button class="add-task-btn" (click)="openCreateModal(col.id)" title="Add task">+</button>
              </div>

              <div class="task-list"
                   cdkDropList
                   [cdkDropListData]="col.tasks"
                   [id]="col.id"
                   [cdkDropListConnectedTo]="columnIds"
                   (cdkDropListDropped)="onDrop($event, col.id)"
                   [class.drag-over]="false">

                @for (task of col.tasks; track task.id) {
                  <div class="task-card" cdkDrag [cdkDragData]="task" (click)="openTask(task)">
                    <div cdkDragPlaceholder class="task-placeholder"></div>

                    <div class="task-header">
                      <span class="task-key">{{ task.projectKey }}-{{ task.id }}</span>
                      <span class="priority-badge" [class]="task.priority.toLowerCase()">{{ task.priority }}</span>
                    </div>
                    <p class="task-title">{{ task.title }}</p>
                    @if (task.description) {
                      <p class="task-desc">{{ task.description }}</p>
                    }
                    <div class="task-footer">
                      <div class="task-meta-left">
                        @if (task.dueDate) {
                          <span class="due-badge" [class.overdue]="isOverdue(task.dueDate)">
                            📅 {{ task.dueDate | date:'MMM d' }}
                          </span>
                        }
                        @if (task.commentsCount > 0) {
                          <span class="comment-badge">💬 {{ task.commentsCount }}</span>
                        }
                        @if (task.storyPoints) {
                          <span class="points-badge">{{ task.storyPoints }}pt</span>
                        }
                      </div>
                      @if (task.assignee) {
                        <div class="assignee-avatar" [title]="task.assignee.fullName || task.assignee.username"
                             [style.background]="getAvatarColor(task.assignee.id)">
                          @if (task.assignee.avatarUrl) {
                            <img [src]="task.assignee.avatarUrl" [alt]="task.assignee.fullName || ''" />
                          } @else {
                            {{ (task.assignee.fullName || task.assignee.username)[0].toUpperCase() }}
                          }
                        </div>
                      }
                    </div>
                  </div>
                }

                @if (col.tasks.length === 0) {
                  <div class="empty-column">Drop tasks here</div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (selectedTask()) {
      <app-task-modal
        [task]="selectedTask()!"
        [projectId]="projectId()"
        (closed)="selectedTask.set(null)"
        (updated)="onTaskUpdated($event)"
        (deleted)="onTaskDeleted($event)" />
    }

    @if (showCreateModal()) {
      <app-task-modal
        [projectId]="projectId()"
        [defaultStatus]="createStatus()"
        (closed)="showCreateModal.set(false)"
        (created)="onTaskCreated($event)" />
    }
  `,
  styles: [`
    .board-container { height: calc(100vh - 132px); display: flex; flex-direction: column; }
    .board-toolbar { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; background: white; border-bottom: 1px solid #e2e8f0; }
    .search-box { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.75rem; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; }
    .search-box input { border: none; outline: none; font-size: 0.875rem; background: transparent; width: 200px; }
    .btn-add {
      display: flex; align-items: center; gap: 0.35rem; margin-left: auto;
      padding: 0.5rem 1rem; background: #6366f1; color: white; border: none;
      border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.15s;
    }
    .btn-add:hover { background: #4f46e5; }
    .board-loading { display: flex; align-items: center; justify-content: center; flex: 1; }
    .spinner-lg { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .kanban-board { display: flex; gap: 1.25rem; padding: 1.25rem 1.5rem; overflow-x: auto; flex: 1; align-items: flex-start; }
    .kanban-column { min-width: 300px; max-width: 300px; background: #f1f5f9; border-radius: 12px; display: flex; flex-direction: column; max-height: 100%; }
    .column-header { padding: 0.875rem 1rem; border-top: 3px solid; border-radius: 12px 12px 0 0; background: white; display: flex; align-items: center; justify-content: space-between; }
    .column-title-row { display: flex; align-items: center; gap: 0.5rem; }
    .column-dot { width: 8px; height: 8px; border-radius: 50%; }
    .column-title { font-size: 0.875rem; font-weight: 600; color: #374151; margin: 0; }
    .column-count { background: #f1f5f9; color: #6b7280; font-size: 0.75rem; font-weight: 600; padding: 0.1rem 0.4rem; border-radius: 10px; }
    .add-task-btn { width: 24px; height: 24px; background: none; border: none; font-size: 1.2rem; color: #9ca3af; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .add-task-btn:hover { background: #e2e8f0; color: #374151; }
    .task-list { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.6rem; overflow-y: auto; flex: 1; min-height: 80px; }
    .task-card {
      background: white; border-radius: 8px; padding: 0.875rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07); cursor: pointer;
      border: 1.5px solid transparent; transition: all 0.15s;
    }
    .task-card:hover { border-color: #6366f1; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .task-placeholder { border: 2px dashed #c7d2fe; border-radius: 8px; height: 80px; background: #eef2ff; }
    .cdk-drag-animating { transition: transform 200ms cubic-bezier(0,0,0.2,1); }
    .cdk-drop-list-dragging .task-card:not(.cdk-drag-placeholder) { transition: transform 200ms; }
    .task-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
    .task-key { font-size: 0.72rem; color: #94a3b8; font-weight: 500; }
    .priority-badge { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; padding: 0.15rem 0.4rem; border-radius: 3px; }
    .priority-badge.low    { background: #dcfce7; color: #16a34a; }
    .priority-badge.medium { background: #fef3c7; color: #d97706; }
    .priority-badge.high   { background: #fee2e2; color: #dc2626; }
    .priority-badge.critical { background: #dc2626; color: white; }
    .task-title { font-size: 0.875rem; font-weight: 500; color: #1e293b; margin: 0 0 0.35rem; line-height: 1.4; }
    .task-desc { font-size: 0.78rem; color: #94a3b8; margin: 0 0 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .task-footer { display: flex; align-items: center; justify-content: space-between; }
    .task-meta-left { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .due-badge, .comment-badge, .points-badge { font-size: 0.72rem; color: #64748b; }
    .due-badge.overdue { color: #ef4444; font-weight: 600; }
    .points-badge { background: #eff6ff; color: #3b82f6; padding: 0.1rem 0.35rem; border-radius: 4px; font-weight: 600; }
    .assignee-avatar {
      width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem; font-weight: 700; color: white; overflow: hidden;
    }
    .assignee-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .empty-column { padding: 1.5rem; text-align: center; color: #94a3b8; font-size: 0.8rem; border: 2px dashed #e2e8f0; border-radius: 8px; }
  `]
})
export class KanbanBoardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private notify = inject(NotificationService);

  readonly loading = signal(true);
  readonly projectId = signal(0);
  readonly selectedTask = signal<Task | null>(null);
  readonly showCreateModal = signal(false);
  readonly createStatus = signal<TaskStatus>('TODO');
  searchTerm = '';

  private allTasks: { todo: Task[], inProgress: Task[], done: Task[] } = { todo: [], inProgress: [], done: [] };

  readonly columns = signal<Column[]>([
    { id: 'TODO', label: 'To Do', color: '#6366f1', tasks: [] },
    { id: 'IN_PROGRESS', label: 'In Progress', color: '#f59e0b', tasks: [] },
    { id: 'DONE', label: 'Done', color: '#10b981', tasks: [] }
  ]);

  readonly columnIds = ['TODO', 'IN_PROGRESS', 'DONE'];

  ngOnInit(): void {
    const id = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.projectId.set(id);
    this.loadBoard();
  }

  loadBoard(): void {
    this.loading.set(true);
    this.taskService.getKanbanBoard(this.projectId()).subscribe({
      next: board => {
        this.allTasks = { todo: board.todo, inProgress: board.inProgress, done: board.done };
        this.updateColumns(board.todo, board.inProgress, board.done);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  updateColumns(todo: Task[], inProgress: Task[], done: Task[]): void {
    this.columns.update(cols => cols.map(col => ({
      ...col,
      tasks: col.id === 'TODO' ? [...todo] : col.id === 'IN_PROGRESS' ? [...inProgress] : [...done]
    })));
  }

  filterTasks(): void {
    const q = this.searchTerm.toLowerCase();
    if (!q) {
      this.updateColumns(this.allTasks.todo, this.allTasks.inProgress, this.allTasks.done);
    } else {
      const f = (tasks: Task[]) => tasks.filter(t => t.title.toLowerCase().includes(q));
      this.updateColumns(f(this.allTasks.todo), f(this.allTasks.inProgress), f(this.allTasks.done));
    }
  }

  onDrop(event: CdkDragDrop<Task[]>, targetStatus: TaskStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }

    const task: Task = event.container.data[event.currentIndex];
    const newPosition = event.currentIndex + 1;

    // Update in allTasks to keep in sync
    const removeFromAll = (t: Task) => {
      this.allTasks.todo = this.allTasks.todo.filter(x => x.id !== t.id);
      this.allTasks.inProgress = this.allTasks.inProgress.filter(x => x.id !== t.id);
      this.allTasks.done = this.allTasks.done.filter(x => x.id !== t.id);
    };
    removeFromAll(task);
    if (targetStatus === 'TODO') this.allTasks.todo.splice(event.currentIndex, 0, { ...task, status: targetStatus });
    else if (targetStatus === 'IN_PROGRESS') this.allTasks.inProgress.splice(event.currentIndex, 0, { ...task, status: targetStatus });
    else this.allTasks.done.splice(event.currentIndex, 0, { ...task, status: targetStatus });

    this.taskService.updatePosition(task.id, { status: targetStatus, position: newPosition }).subscribe({
      error: () => {
        this.notify.error('Failed to update task position');
        this.loadBoard();
      }
    });
  }

  openTask(task: Task): void { this.selectedTask.set(task); }

  openCreateModal(status: TaskStatus = 'TODO'): void {
    this.createStatus.set(status);
    this.showCreateModal.set(true);
  }

  onTaskCreated(task: Task): void {
    this.showCreateModal.set(false);
    this.loadBoard();
    this.notify.success('Task created');
  }

  onTaskUpdated(task: Task): void {
    this.selectedTask.set(null);
    this.loadBoard();
  }

  onTaskDeleted(id: number): void {
    this.selectedTask.set(null);
    this.loadBoard();
    this.notify.success('Task deleted');
  }

  isOverdue(date: string): boolean { return new Date(date) < new Date(); }

  getAvatarColor(id: number): string {
    const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4'];
    return colors[id % colors.length];
  }
}
