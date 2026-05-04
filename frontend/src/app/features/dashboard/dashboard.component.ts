import { Component, OnInit, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DatePipe } from "@angular/common";
import { AuthStateService } from "../../core/services/auth-state.service";
import { ProjectService } from "../../core/services/project.service";
import { TaskService } from "../../core/services/task.service";
import { Project, Task } from "../../shared/models";
// Pipe for status labels
import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "statusLabel", standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(status: string): string {
    return (
      { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" }[status] ||
      status
    );
  }
}

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [RouterLink, DatePipe, StatusLabelPipe],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Good {{ greeting() }}, {{ firstName() }} 👋</h1>
          <p class="subtitle">Here's what's happening across your projects</p>
        </div>
        <a routerLink="/projects/new" class="btn-primary">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Project
        </a>
      </header>

      <!-- Stats cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon projects">📁</div>
          <div class="stat-body">
            <div class="stat-value">{{ projects().length }}</div>
            <div class="stat-label">Active Projects</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon tasks">✅</div>
          <div class="stat-body">
            <div class="stat-value">{{ myTasks().length }}</div>
            <div class="stat-label">My Open Tasks</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon overdue">🔥</div>
          <div class="stat-body">
            <div class="stat-value">{{ overdueTasks() }}</div>
            <div class="stat-label">Overdue</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon done">🎯</div>
          <div class="stat-body">
            <div class="stat-value">{{ doneTasks() }}</div>
            <div class="stat-label">Completed This Week</div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Recent Projects -->
        <section class="card">
          <div class="card-header">
            <h2>Recent Projects</h2>
            <a routerLink="/projects" class="link">View all →</a>
          </div>
          @if (loadingProjects()) {
            <div class="skeleton-list">
              @for (i of [1, 2, 3]; track i) {
                <div class="skeleton-row"></div>
              }
            </div>
          } @else if (projects().length === 0) {
            <div class="empty-state">
              <span>📁</span>
              <p>
                No projects yet.
                <a routerLink="/projects/new">Create your first</a>
              </p>
            </div>
          } @else {
            <div class="project-list">
              @for (p of projects().slice(0, 5); track p.id) {
                <a
                  [routerLink]="['/projects', p.id, 'board']"
                  class="project-row"
                >
                  <div class="project-color" [style.background]="p.color"></div>
                  <div class="project-info">
                    <span class="project-name">{{ p.name }}</span>
                    <span class="project-meta"
                      >{{ p.key }} · {{ p.taskCount }} tasks ·
                      {{ p.members.length }} members</span
                    >
                  </div>
                  <span
                    class="project-status"
                    [class]="p.status.toLowerCase()"
                    >{{ p.status }}</span
                  >
                </a>
              }
            </div>
          }
        </section>

        <!-- My Tasks -->
        <section class="card">
          <div class="card-header">
            <h2>My Tasks</h2>
            <a routerLink="/tasks" class="link">View all →</a>
          </div>
          @if (loadingTasks()) {
            <div class="skeleton-list">
              @for (i of [1, 2, 3]; track i) {
                <div class="skeleton-row"></div>
              }
            </div>
          } @else if (myTasks().length === 0) {
            <div class="empty-state">
              <span>✅</span>
              <p>No tasks assigned to you</p>
            </div>
          } @else {
            <div class="task-list">
              @for (t of myTasks().slice(0, 6); track t.id) {
                <div class="task-row">
                  <span
                    class="priority-dot"
                    [class]="t.priority.toLowerCase()"
                  ></span>
                  <div class="task-info">
                    <span class="task-title">{{ t.title }}</span>
                    <span class="task-meta"
                      >{{ t.projectName }} · {{ t.status | statusLabel }}</span
                    >
                  </div>
                  @if (t.dueDate) {
                    <span
                      class="due-date"
                      [class.overdue]="isOverdue(t.dueDate)"
                    >
                      {{ t.dueDate | date: "MMM d" }}
                    </span>
                  }
                </div>
              }
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
      }
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
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
      .btn-primary {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.6rem 1.25rem;
        background: #6366f1;
        color: white;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.15s;
      }
      .btn-primary:hover {
        background: #4f46e5;
        transform: translateY(-1px);
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        border: 1px solid #f1f5f9;
      }
      .stat-icon {
        font-size: 2rem;
      }
      .stat-value {
        font-size: 1.75rem;
        font-weight: 800;
        color: #0f172a;
      }
      .stat-label {
        font-size: 0.8rem;
        color: #64748b;
      }
      .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }
      .card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        border: 1px solid #f1f5f9;
      }
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
      }
      .card-header h2 {
        font-size: 1rem;
        font-weight: 600;
        color: #0f172a;
        margin: 0;
      }
      .link {
        font-size: 0.85rem;
        color: #6366f1;
        text-decoration: none;
      }
      .project-list,
      .task-list {
        display: flex;
        flex-direction: column;
      }
      .project-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f1f5f9;
        text-decoration: none;
        transition: background 0.1s;
      }
      .project-row:last-child {
        border-bottom: none;
      }
      .project-row:hover {
        background: #f8fafc;
        margin: 0 -1rem;
        padding-left: 1rem;
        padding-right: 1rem;
        border-radius: 6px;
      }
      .project-color {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .project-name {
        font-size: 0.9rem;
        font-weight: 500;
        color: #1e293b;
      }
      .project-meta {
        font-size: 0.78rem;
        color: #94a3b8;
      }
      .project-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }
      .project-status {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
      }
      .project-status.active {
        background: #dcfce7;
        color: #16a34a;
      }
      .project-status.archived {
        background: #f1f5f9;
        color: #64748b;
      }
      .task-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.65rem 0;
        border-bottom: 1px solid #f1f5f9;
      }
      .task-row:last-child {
        border-bottom: none;
      }
      .priority-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
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
      .task-info {
        flex: 1;
        overflow: hidden;
      }
      .task-title {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .task-meta {
        font-size: 0.75rem;
        color: #94a3b8;
      }
      .due-date {
        font-size: 0.75rem;
        color: #64748b;
        white-space: nowrap;
      }
      .due-date.overdue {
        color: #ef4444;
        font-weight: 600;
      }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 2rem;
        color: #94a3b8;
        font-size: 0.9rem;
      }
      .empty-state span {
        font-size: 2rem;
      }
      .skeleton-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .skeleton-row {
        height: 40px;
        background: linear-gradient(
          90deg,
          #f1f5f9 25%,
          #e2e8f0 50%,
          #f1f5f9 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 6px;
      }
      @keyframes shimmer {
        to {
          background-position: -200% 0;
        }
      }
      @media (max-width: 1024px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private authState = inject(AuthStateService);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);

  readonly projects = signal<Project[]>([]);
  readonly myTasks = signal<Task[]>([]);
  readonly loadingProjects = signal(true);
  readonly loadingTasks = signal(true);

  ngOnInit(): void {
    this.projectService.getProjects(undefined, 0, 10).subscribe({
      next: (res) => {
        this.projects.set(res.content);
        this.loadingProjects.set(false);
      },
      error: () => this.loadingProjects.set(false),
    });
    this.taskService.getMyTasks(0, 20).subscribe({
      next: (res) => {
        this.myTasks.set(res.content.filter((t) => t.status !== "DONE"));
        this.loadingTasks.set(false);
      },
      error: () => this.loadingTasks.set(false),
    });
  }

  greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  }

  firstName(): string {
    const u = this.authState.user();
    return (u?.fullName || u?.username || "there").split(" ")[0];
  }

  overdueTasks(): number {
    return this.myTasks().filter((t) => t.dueDate && this.isOverdue(t.dueDate))
      .length;
  }

  doneTasks(): number {
    return 0; // Would query done tasks this week
  }

  isOverdue(date: string): boolean {
    return new Date(date) < new Date();
  }
}
