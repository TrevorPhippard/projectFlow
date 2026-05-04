import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../shared/models';

@Component({
  selector: 'app-project-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    @if (loading()) {
      <div class="loading-bar"></div>
    } @else if (project()) {
      <div class="project-shell">
        <header class="project-header">
          <div class="project-breadcrumb">
            <a routerLink="/projects">Projects</a>
            <span>›</span>
            <span>{{ project()!.name }}</span>
          </div>
          <div class="project-title-row">
            <div class="project-badge" [style.background]="project()!.color + '20'" [style.color]="project()!.color">
              {{ project()!.key }}
            </div>
            <h1>{{ project()!.name }}</h1>
          </div>
          <nav class="project-tabs">
            <a [routerLink]="['board']" routerLinkActive="active" class="tab">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="5" height="18"/><rect x="10" y="3" width="5" height="18"/><rect x="17" y="3" width="5" height="18"/>
              </svg>
              Board
            </a>
            <a [routerLink]="['tasks']" routerLinkActive="active" class="tab">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Tasks
            </a>
            <a [routerLink]="['members']" routerLinkActive="active" class="tab">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
              Members ({{ project()!.members.length }})
            </a>
            <a [routerLink]="['settings']" routerLinkActive="active" class="tab">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              Settings
            </a>
          </nav>
        </header>
        <div class="project-content">
          <router-outlet />
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-bar { height: 3px; background: linear-gradient(90deg, #6366f1, #a5b4fc); animation: loading 1s ease infinite; }
    @keyframes loading { 0%,100%{width:30%} 50%{width:80%} }
    .project-shell { display: flex; flex-direction: column; height: 100vh; }
    .project-header { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 1.5rem 0; }
    .project-breadcrumb { font-size: 0.8rem; color: #94a3b8; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.75rem; }
    .project-breadcrumb a { color: #64748b; text-decoration: none; }
    .project-breadcrumb a:hover { color: #6366f1; }
    .project-title-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .project-badge { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; letter-spacing: 0.05em; }
    .project-title-row h1 { font-size: 1.3rem; font-weight: 700; color: #0f172a; margin: 0; }
    .project-tabs { display: flex; gap: 0; }
    .tab {
      display: flex; align-items: center; gap: 0.4rem; padding: 0.65rem 1rem;
      color: #64748b; text-decoration: none; font-size: 0.875rem; font-weight: 500;
      border-bottom: 2px solid transparent; transition: all 0.15s;
    }
    .tab:hover { color: #1e293b; }
    .tab.active { color: #6366f1; border-bottom-color: #6366f1; }
    .project-content { flex: 1; overflow: hidden; }
  `]
})
export class ProjectShellComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);

  readonly project = signal<Project | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.projectService.getProject(id).subscribe({
      next: p => { this.project.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
