import { Component, OnInit, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DatePipe } from "@angular/common";
import { TaskService } from "../../../core/services/task.service";
import { Task } from "../../../shared/models";

@Component({
  selector: "app-my-tasks",
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>My Tasks</h1>
          <p class="subtitle">All tasks assigned to you across projects</p>
        </div>
      </header>

      <div class="task-groups">
        @if (loading()) {
          <div class="loading"><div class="spinner"></div></div>
        } @else if (tasks().length === 0) {
          <div class="empty-page">
            <span>🎉</span>
            <h2>All clear!</h2>
            <p>You have no tasks assigned to you</p>
          </div>
        } @else {
          <!-- Overdue -->
          @if (overdue().length > 0) {
            <div class="task-group">
              <div class="group-header overdue-header">
                <span class="group-icon">🔥</span>
                <h3>Overdue ({{ overdue().length }})</h3>
              </div>
              <div class="task-cards">
                @for (task of overdue(); track task.id) {
                  <ng-container
                    *ngTemplateOutlet="taskCard; context: { task }"
                  ></ng-container>
                }
              </div>
            </div>
          }

          <!-- In Progress -->
          @if (inProgress().length > 0) {
            <div class="task-group">
              <div class="group-header">
                <span class="group-dot" style="background:#f59e0b"></span>
                <h3>In Progress ({{ inProgress().length }})</h3>
              </div>
              <div class="task-cards">
                @for (task of inProgress(); track task.id) {
                  <div
                    class="task-card"
                    [routerLink]="['/projects', task.projectId, 'board']"
                  >
                    <div class="card-top">
                      <span class="task-key-sm"
                        >{{ task.projectKey }}-{{ task.id }}</span
                      >
                      <span
                        class="priority-dot"
                        [class]="task.priority.toLowerCase()"
                      ></span>
                    </div>
                    <p class="task-title">{{ task.title }}</p>
                    <div class="card-bottom">
                      <span class="project-tag">{{ task.projectName }}</span>
                      @if (task.dueDate) {
                        <span class="due-sm"
                          >📅 {{ task.dueDate | date: "MMM d" }}</span
                        >
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- To Do -->
          @if (todo().length > 0) {
            <div class="task-group">
              <div class="group-header">
                <span class="group-dot" style="background:#6366f1"></span>
                <h3>To Do ({{ todo().length }})</h3>
              </div>
              <div class="task-cards">
                @for (task of todo(); track task.id) {
                  <div
                    class="task-card"
                    [routerLink]="['/projects', task.projectId, 'board']"
                  >
                    <div class="card-top">
                      <span class="task-key-sm"
                        >{{ task.projectKey }}-{{ task.id }}</span
                      >
                      <span
                        class="priority-dot"
                        [class]="task.priority.toLowerCase()"
                      ></span>
                    </div>
                    <p class="task-title">{{ task.title }}</p>
                    <div class="card-bottom">
                      <span class="project-tag">{{ task.projectName }}</span>
                      @if (task.dueDate) {
                        <span class="due-sm"
                          >📅 {{ task.dueDate | date: "MMM d" }}</span
                        >
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>

    <ng-template #taskCard let-task="task">
      <div
        class="task-card overdue-card"
        [routerLink]="['/projects', task.projectId, 'board']"
      >
        <div class="card-top">
          <span class="task-key-sm">{{ task.projectKey }}-{{ task.id }}</span>
          <span
            class="priority-dot"
            [class]="task.priority.toLowerCase()"
          ></span>
        </div>
        <p class="task-title">{{ task.title }}</p>
        <div class="card-bottom">
          <span class="project-tag">{{ task.projectName }}</span>
          @if (task.dueDate) {
            <span class="due-sm overdue-text"
              >📅 {{ task.dueDate | date: "MMM d" }}</span
            >
          }
        </div>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .page {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: 2rem;
      }
      .page-header h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 0.25rem;
      }
      .subtitle {
        color: #64748b;
        margin: 0;
      }
      .loading {
        display: flex;
        justify-content: center;
        padding: 4rem;
      }
      .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid #e2e8f0;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .task-groups {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
      .task-group {
      }
      .group-header {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 1rem;
      }
      .group-header h3 {
        font-size: 0.95rem;
        font-weight: 700;
        color: #374151;
        margin: 0;
      }
      .group-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
      }
      .group-icon {
        font-size: 1rem;
      }
      .overdue-header h3 {
        color: #dc2626;
      }
      .task-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 0.875rem;
      }
      .task-card {
        background: white;
        border-radius: 10px;
        padding: 1rem;
        border: 1px solid #f1f5f9;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        cursor: pointer;
        transition: all 0.15s;
        text-decoration: none;
        display: block;
      }
      .task-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: #e0e7ff;
      }
      .overdue-card {
        border-color: #fecaca;
        background: #fffafa;
      }
      .card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }
      .task-key-sm {
        font-size: 0.72rem;
        color: #94a3b8;
        font-weight: 500;
        font-family: monospace;
      }
      .priority-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .priority-dot.low {
        background: #22c55e;
      }
      .priority-dot.medium {
        background: #f59e0b;
      }
      .priority-dot.high {
        background: #f97316;
      }
      .priority-dot.critical {
        background: #ef4444;
      }
      .task-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: #1e293b;
        margin: 0 0 0.75rem;
        line-height: 1.4;
      }
      .card-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .project-tag {
        font-size: 0.72rem;
        color: #64748b;
        background: #f1f5f9;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
      }
      .due-sm {
        font-size: 0.75rem;
        color: #64748b;
      }
      .overdue-text {
        color: #dc2626;
        font-weight: 600;
      }
      .empty-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 5rem 2rem;
        text-align: center;
      }
      .empty-page span {
        font-size: 3.5rem;
      }
      .empty-page h2 {
        font-size: 1.4rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
      }
      .empty-page p {
        color: #64748b;
        margin: 0;
      }
      @media (max-width: 640px) {
        .task-cards {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class MyTasksComponent implements OnInit {
  private taskService = inject(TaskService);

  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.taskService.getMyTasks(0, 100).subscribe({
      next: (res) => {
        this.tasks.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  todo() {
    return this.tasks().filter(
      (t) => t.status === "TODO" && !this.isOverdue(t)
    );
  }
  inProgress() {
    return this.tasks().filter(
      (t) => t.status === "IN_PROGRESS" && !this.isOverdue(t)
    );
  }
  overdue() {
    return this.tasks().filter(
      (t) =>
        t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < new Date()
    );
  }
  isOverdue(t: Task) {
    return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE";
  }
}
