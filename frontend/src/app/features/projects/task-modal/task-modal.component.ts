import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Task, TaskStatus, TaskPriority, UserSummary, TaskComment } from '../../../shared/models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-panel" [class.wide]="!!task">
        <div class="modal-header">
          <div class="modal-title-area">
            @if (task) {
              <span class="task-key-label">{{ task.projectKey }}-{{ task.id }}</span>
            }
            <h2>{{ task ? 'Task Details' : 'Create Task' }}</h2>
          </div>
          <button class="close-btn" (click)="closed.emit()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        @if (task && !editing()) {
          <!-- VIEW MODE -->
          <div class="modal-body split">
            <div class="main-col">
              <h3 class="view-title">{{ task.title }}</h3>
              @if (task.description) {
                <div class="description-view">{{ task.description }}</div>
              } @else {
                <p class="no-desc">No description provided.</p>
              }

              <!-- Comments -->
              <div class="comments-section">
                <h4>Comments ({{ comments().length }})</h4>
                <div class="comment-input-row">
                  <textarea [(ngModel)]="newComment" placeholder="Add a comment..." rows="2" class="comment-input"></textarea>
                  <button class="btn-sm-primary" [disabled]="!newComment.trim() || submittingComment()" (click)="submitComment()">
                    @if (submittingComment()) { <span class="spinner-xs"></span> } Post
                  </button>
                </div>
                <div class="comments-list">
                  @for (c of comments(); track c.id) {
                    <div class="comment-item">
                      <div class="comment-avatar" [style.background]="getAvatarColor(c.author.id)">
                        {{ (c.author.fullName || c.author.username)[0].toUpperCase() }}
                      </div>
                      <div class="comment-body">
                        <div class="comment-meta">
                          <strong>{{ c.author.fullName || c.author.username }}</strong>
                          <span>{{ c.createdAt | date:'MMM d, y HH:mm' }}</span>
                        </div>
                        <p class="comment-text">{{ c.content }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="side-col">
              <div class="detail-group">
                <label>Status</label>
                <span class="status-chip" [class]="task.status.toLowerCase()">
                  {{ statusLabels[task.status] }}
                </span>
              </div>
              <div class="detail-group">
                <label>Priority</label>
                <span class="priority-chip" [class]="task.priority.toLowerCase()">{{ task.priority }}</span>
              </div>
              <div class="detail-group">
                <label>Assignee</label>
                @if (task.assignee) {
                  <div class="user-chip">
                    <div class="user-avatar-xs" [style.background]="getAvatarColor(task.assignee.id)">
                      {{ (task.assignee.fullName || task.assignee.username)[0].toUpperCase() }}
                    </div>
                    {{ task.assignee.fullName || task.assignee.username }}
                  </div>
                } @else { <span class="muted">Unassigned</span> }
              </div>
              <div class="detail-group">
                <label>Reporter</label>
                <div class="user-chip">
                  <div class="user-avatar-xs" [style.background]="getAvatarColor(task.reporter.id)">
                    {{ (task.reporter.fullName || task.reporter.username)[0].toUpperCase() }}
                  </div>
                  {{ task.reporter.fullName || task.reporter.username }}
                </div>
              </div>
              <div class="detail-group">
                <label>Due Date</label>
                <span>{{ task.dueDate ? (task.dueDate | date:'MMM d, y') : '—' }}</span>
              </div>
              <div class="detail-group">
                <label>Story Points</label>
                <span>{{ task.storyPoints ?? '—' }}</span>
              </div>
              <div class="detail-group">
                <label>Created</label>
                <span>{{ task.createdAt | date:'MMM d, y' }}</span>
              </div>

              <div class="action-buttons">
                <button class="btn-outline" (click)="editing.set(true)">✏️ Edit</button>
                <button class="btn-danger-outline" (click)="confirmDelete()">🗑️ Delete</button>
              </div>
            </div>
          </div>

        } @else {
          <!-- CREATE / EDIT FORM -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body form-body">
            <div class="field-group full">
              <label>Title <span class="required">*</span></label>
              <input formControlName="title" placeholder="Task title..." [class.invalid]="isInvalid('title')" />
              @if (isInvalid('title')) { <span class="field-error">Title is required</span> }
            </div>

            <div class="field-group full">
              <label>Description</label>
              <textarea formControlName="description" placeholder="Add a description..." rows="4"></textarea>
            </div>

            <div class="form-row">
              <div class="field-group">
                <label>Status</label>
                <select formControlName="status">
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div class="field-group">
                <label>Priority</label>
                <select formControlName="priority">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="field-group">
                <label>Assignee</label>
                <select formControlName="assigneeId">
                  <option [ngValue]="null">Unassigned</option>
                  @for (m of projectMembers(); track m.id) {
                    <option [ngValue]="m.id">{{ m.fullName || m.username }}</option>
                  }
                </select>
              </div>
              <div class="field-group">
                <label>Due Date</label>
                <input type="date" formControlName="dueDate" />
              </div>
            </div>

            <div class="form-row">
              <div class="field-group">
                <label>Story Points</label>
                <input type="number" formControlName="storyPoints" min="1" max="100" placeholder="e.g. 3" />
              </div>
            </div>

            @if (serverError()) {
              <div class="error-alert">{{ serverError() }}</div>
            }

            <div class="modal-footer">
              <button type="button" class="btn-ghost" (click)="onCancel()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving()">
                @if (saving()) { <span class="spinner-xs"></span> }
                {{ task ? 'Save Changes' : 'Create Task' }}
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem; backdrop-filter: blur(2px);
      animation: fadeIn 0.15s;
    }
    @keyframes fadeIn { from { opacity: 0; } }
    .modal-panel {
      background: white; border-radius: 16px; width: 100%; max-width: 540px;
      max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: slideUp 0.2s;
    }
    .modal-panel.wide { max-width: 860px; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } }
    .modal-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9;
    }
    .task-key-label { font-size: 0.75rem; color: #94a3b8; font-weight: 500; display: block; margin-bottom: 0.25rem; }
    .modal-header h2 { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; }
    .close-btn { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0.25rem; border-radius: 6px; display: flex; }
    .close-btn:hover { background: #f1f5f9; color: #374151; }
    .modal-body { padding: 1.25rem 1.5rem; overflow-y: auto; flex: 1; }
    .modal-body.split { display: grid; grid-template-columns: 1fr 280px; gap: 1.5rem; align-items: start; }
    .view-title { font-size: 1.2rem; font-weight: 600; color: #0f172a; margin: 0 0 0.75rem; }
    .description-view { font-size: 0.9rem; color: #374151; line-height: 1.6; white-space: pre-wrap; }
    .no-desc { color: #94a3b8; font-size: 0.875rem; }
    .side-col { background: #f8fafc; border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: 0.875rem; }
    .detail-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .detail-group label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .status-chip { display: inline-block; font-size: 0.8rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 6px; }
    .status-chip.todo { background: #eff6ff; color: #3b82f6; }
    .status-chip.in_progress { background: #fef3c7; color: #d97706; }
    .status-chip.done { background: #dcfce7; color: #16a34a; }
    .priority-chip { display: inline-block; font-size: 0.8rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 6px; text-transform: capitalize; }
    .priority-chip.low { background: #dcfce7; color: #16a34a; }
    .priority-chip.medium { background: #fef3c7; color: #d97706; }
    .priority-chip.high { background: #fee2e2; color: #dc2626; }
    .priority-chip.critical { background: #dc2626; color: white; }
    .user-chip { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; }
    .user-avatar-xs { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: white; }
    .muted { color: #94a3b8; font-size: 0.875rem; }
    .action-buttons { display: flex; gap: 0.5rem; flex-direction: column; margin-top: 0.5rem; }
    .btn-outline, .btn-danger-outline {
      padding: 0.5rem 0.875rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500;
      cursor: pointer; transition: all 0.15s; text-align: center; border: 1.5px solid;
    }
    .btn-outline { border-color: #e2e8f0; background: white; color: #374151; }
    .btn-outline:hover { background: #f8fafc; }
    .btn-danger-outline { border-color: #fecaca; background: white; color: #dc2626; }
    .btn-danger-outline:hover { background: #fef2f2; }
    .comments-section { margin-top: 1.5rem; }
    .comments-section h4 { font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.875rem; }
    .comment-input-row { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
    .comment-input { padding: 0.65rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; resize: vertical; outline: none; font-family: inherit; }
    .comment-input:focus { border-color: #6366f1; }
    .btn-sm-primary { padding: 0.5rem 1rem; background: #6366f1; color: white; border: none; border-radius: 7px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; align-self: flex-end; }
    .btn-sm-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .comment-item { display: flex; gap: 0.75rem; padding: 0.75rem 0; border-top: 1px solid #f1f5f9; }
    .comment-avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: white; flex-shrink: 0; }
    .comment-body { flex: 1; }
    .comment-meta { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
    .comment-meta strong { font-size: 0.85rem; color: #1e293b; }
    .comment-meta span { font-size: 0.75rem; color: #94a3b8; }
    .comment-text { font-size: 0.875rem; color: #374151; margin: 0; line-height: 1.5; }
    .form-body { display: flex; flex-direction: column; gap: 1rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }
    .field-group.full { flex-basis: 100%; }
    .field-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
    .required { color: #ef4444; }
    .field-group input, .field-group textarea, .field-group select {
      padding: 0.6rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; outline: none; transition: border-color 0.15s; font-family: inherit;
    }
    .field-group input:focus, .field-group textarea:focus, .field-group select:focus {
      border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
    }
    .field-group input.invalid { border-color: #ef4444; }
    .field-error { font-size: 0.75rem; color: #ef4444; }
    .form-row { display: flex; gap: 1rem; }
    .error-alert { padding: 0.75rem 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.875rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.5rem; }
    .btn-ghost { padding: 0.6rem 1.25rem; border: none; background: none; color: #64748b; border-radius: 8px; font-weight: 500; cursor: pointer; }
    .btn-ghost:hover { background: #f1f5f9; }
    .btn-primary {
      display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.5rem;
      background: #6366f1; color: white; border: none; border-radius: 8px;
      font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
    .spinner-xs { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class TaskModalComponent implements OnInit {
  @Input() task?: Task;
  @Input() projectId!: number;
  @Input() defaultStatus: TaskStatus = 'TODO';
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<Task>();
  @Output() updated = new EventEmitter<Task>();
  @Output() deleted = new EventEmitter<number>();

  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private notify = inject(NotificationService);

  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly projectMembers = signal<UserSummary[]>([]);
  readonly comments = signal<TaskComment[]>([]);
  readonly submittingComment = signal(false);
  newComment = '';

  readonly statusLabels: Record<string, string> = {
    TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done'
  };

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    status: ['TODO'],
    priority: ['MEDIUM'],
    assigneeId: [null as number | null],
    dueDate: [''],
    storyPoints: [null as number | null]
  });

  ngOnInit(): void {
    if (this.task) {
      this.form.patchValue({
        title: this.task.title,
        description: this.task.description || '',
        status: this.task.status,
        priority: this.task.priority,
        assigneeId: this.task.assignee?.id ?? null,
        dueDate: this.task.dueDate || '',
        storyPoints: this.task.storyPoints ?? null
      });
      this.loadComments();
    } else {
      this.form.patchValue({ status: this.defaultStatus });
    }
    this.loadProjectMembers();
  }

  loadProjectMembers(): void {
    this.userService.searchUsers('', 0, 50).subscribe({
      next: res => this.projectMembers.set(res.content)
    });
  }

  loadComments(): void {
    if (!this.task) return;
    this.taskService.getComments(this.task.id).subscribe({
      next: res => this.comments.set(res.content)
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c?.invalid && !!c?.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.serverError.set(null);

    const val = this.form.value;
    const payload = {
      title: val.title!,
      description: val.description || undefined,
      status: val.status as TaskStatus,
      priority: val.priority as TaskPriority,
      assigneeId: val.assigneeId ?? undefined,
      dueDate: val.dueDate || undefined,
      storyPoints: val.storyPoints ?? undefined
    };

    const request$ = this.task
      ? this.taskService.updateTask(this.task.id, payload)
      : this.taskService.createTask(this.projectId, payload);

    request$.subscribe({
      next: result => {
        this.saving.set(false);
        if (this.task) this.updated.emit(result);
        else this.created.emit(result);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.serverError.set(err.error?.message || 'Failed to save task');
      }
    });
  }

  submitComment(): void {
    if (!this.task || !this.newComment.trim()) return;
    this.submittingComment.set(true);
    this.taskService.addComment(this.task.id, this.newComment.trim()).subscribe({
      next: comment => {
        this.comments.update(c => [comment, ...c]);
        this.newComment = '';
        this.submittingComment.set(false);
      },
      error: () => this.submittingComment.set(false)
    });
  }

  confirmDelete(): void {
    if (!this.task) return;
    if (confirm(`Delete "${this.task.title}"? This cannot be undone.`)) {
      this.taskService.deleteTask(this.task.id).subscribe({
        next: () => this.deleted.emit(this.task!.id),
        error: () => this.notify.error('Failed to delete task')
      });
    }
  }

  onCancel(): void {
    if (this.task) this.editing.set(false);
    else this.closed.emit();
  }

  onBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closed.emit();
    }
  }

  getAvatarColor(id: number): string {
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[id % colors.length];
  }
}
