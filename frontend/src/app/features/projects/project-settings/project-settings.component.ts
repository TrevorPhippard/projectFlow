import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Project } from '../../../shared/models';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6'];

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="settings-page">
      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else if (project()) {
        <section class="settings-section">
          <h2>General Settings</h2>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="field-group">
              <label>Project Color</label>
              <div class="color-picker">
                @for (c of colors; track c) {
                  <button type="button" class="swatch" [style.background]="c"
                    [class.selected]="form.get('color')?.value === c"
                    (click)="form.get('color')?.setValue(c)">
                    @if (form.get('color')?.value === c) {
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    }
                  </button>
                }
              </div>
            </div>
            <div class="field-group">
              <label>Project Name</label>
              <input formControlName="name" />
            </div>
            <div class="field-group">
              <label>Description</label>
              <textarea formControlName="description" rows="3"></textarea>
            </div>
            <div class="field-group">
              <label>Status</label>
              <select formControlName="status">
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            @if (saveError()) {
              <div class="error-alert">{{ saveError() }}</div>
            }
            <button type="submit" class="btn-primary" [disabled]="saving()">
              @if (saving()) { <span class="spinner-xs"></span> }
              Save Changes
            </button>
          </form>
        </section>

        <section class="settings-section danger-zone">
          <h2>Danger Zone</h2>
          <div class="danger-item">
            <div>
              <strong>Delete this project</strong>
              <p>Once deleted, all tasks and data will be permanently removed.</p>
            </div>
            <button class="btn-danger" (click)="deleteProject()">Delete Project</button>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .settings-page { padding: 1.5rem; max-width: 640px; display: flex; flex-direction: column; gap: 1.5rem; }
    .loading { display: flex; justify-content: center; padding: 3rem; }
    .spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .settings-section { background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #f1f5f9; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .settings-section h2 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 1.25rem; }
    form { display: flex; flex-direction: column; gap: 1rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
    .field-group input, .field-group textarea, .field-group select { padding: 0.6rem 0.875rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; outline: none; transition: border-color 0.15s; font-family: inherit; }
    .field-group input:focus, .field-group textarea:focus, .field-group select:focus { border-color: #6366f1; }
    .color-picker { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .swatch { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none; transition: transform 0.15s; }
    .swatch:hover { transform: scale(1.15); }
    .swatch.selected { box-shadow: 0 0 0 3px rgba(0,0,0,0.2); }
    .error-alert { padding: 0.75rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.875rem; }
    .btn-primary { align-self: flex-start; display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.25rem; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.15s; }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
    .spinner-xs { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    .danger-zone { border-color: #fecaca; }
    .danger-zone h2 { color: #dc2626; }
    .danger-item { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .danger-item strong { font-size: 0.9rem; color: #1e293b; }
    .danger-item p { color: #64748b; font-size: 0.8rem; margin: 0.2rem 0 0; }
    .btn-danger { padding: 0.55rem 1.1rem; background: white; border: 1.5px solid #fecaca; color: #dc2626; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
    .btn-danger:hover { background: #fef2f2; }
  `]
})
export class ProjectSettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private notify = inject(NotificationService);

  readonly project = signal<Project | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly colors = COLORS;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    color: ['#6366f1'],
    status: ['ACTIVE']
  });

  ngOnInit(): void {
    const id = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.projectService.getProject(id).subscribe({
      next: p => {
        this.project.set(p);
        this.form.patchValue({ name: p.name, description: p.description || '', color: p.color, status: p.status });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.saveError.set(null);
    const p = this.project()!;
    this.projectService.updateProject(p.id, this.form.value as any).subscribe({
      next: updated => {
        this.project.set(updated);
        this.saving.set(false);
        this.notify.success('Project updated');
      },
      error: err => {
        this.saveError.set(err.error?.message || 'Failed to save');
        this.saving.set(false);
      }
    });
  }

  deleteProject(): void {
    const p = this.project()!;
    if (!confirm(`Delete "${p.name}"? This will permanently delete all tasks. This cannot be undone.`)) return;

    this.projectService.deleteProject(p.id).subscribe({
      next: () => {
        this.notify.success('Project deleted');
        this.router.navigate(['/projects']);
      },
      error: () => this.notify.error('Failed to delete project')
    });
  }
}
