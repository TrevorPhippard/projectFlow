import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
];

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="form-container">
        <div class="form-header">
          <a routerLink="/projects" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Projects
          </a>
          <h1>Create New Project</h1>
          <p>Set up a workspace for your team</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="project-form">
          <!-- Color picker -->
          <div class="field-group">
            <label>Project Color</label>
            <div class="color-picker">
              @for (color of colors; track color) {
                <button type="button" class="color-swatch"
                  [style.background]="color"
                  [class.selected]="form.get('color')?.value === color"
                  (click)="form.get('color')?.setValue(color)">
                  @if (form.get('color')?.value === color) {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  }
                </button>
              }
            </div>
          </div>

          <div class="field-group">
            <label>Project Name <span class="required">*</span></label>
            <input formControlName="name" placeholder="e.g. Mobile App Redesign"
              [class.invalid]="isInvalid('name')" (blur)="autoGenerateKey()" />
            @if (isInvalid('name')) { <span class="field-error">Project name is required (2-200 chars)</span> }
          </div>

          <div class="field-group">
            <label>
              Project Key <span class="required">*</span>
              <span class="label-hint">Used to prefix task IDs (e.g. MAR-1)</span>
            </label>
            <input formControlName="key" placeholder="e.g. MAR" maxlength="10"
              [class.invalid]="isInvalid('key')"
              (input)="uppercaseKey()" />
            @if (isInvalid('key')) {
              <span class="field-error">2-10 uppercase letters/numbers required</span>
            }
          </div>

          <div class="field-group">
            <label>Description</label>
            <textarea formControlName="description" rows="4"
              placeholder="What is this project about?"></textarea>
          </div>

          <!-- Preview -->
          <div class="project-preview">
            <div class="preview-label">Preview</div>
            <div class="preview-card" [style.border-top-color]="form.get('color')?.value || '#6366f1'">
              <div class="preview-key" [style.color]="form.get('color')?.value || '#6366f1'">
                {{ form.get('key')?.value || 'KEY' }}
              </div>
              <div class="preview-name">{{ form.get('name')?.value || 'Project Name' }}</div>
              <div class="preview-desc">{{ form.get('description')?.value || 'Project description...' }}</div>
            </div>
          </div>

          @if (serverError()) {
            <div class="error-alert">{{ serverError() }}</div>
          }

          <div class="form-actions">
            <a routerLink="/projects" class="btn-ghost">Cancel</a>
            <button type="submit" class="btn-primary" [disabled]="saving()">
              @if (saving()) { <span class="spinner"></span> }
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; display: flex; justify-content: center; }
    .form-container { width: 100%; max-width: 620px; }
    .form-header { margin-bottom: 2rem; }
    .back-link {
      display: inline-flex; align-items: center; gap: 0.4rem;
      color: #64748b; text-decoration: none; font-size: 0.875rem; margin-bottom: 1rem;
    }
    .back-link:hover { color: #6366f1; }
    .form-header h1 { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem; }
    .form-header p { color: #64748b; margin: 0; }
    .project-form { display: flex; flex-direction: column; gap: 1.25rem; background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-group label { font-size: 0.875rem; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 0.5rem; }
    .label-hint { font-size: 0.75rem; font-weight: 400; color: #94a3b8; }
    .required { color: #ef4444; }
    .field-group input, .field-group textarea {
      padding: 0.65rem 0.875rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.9rem; outline: none; transition: border-color 0.15s; font-family: inherit;
    }
    .field-group input:focus, .field-group textarea:focus {
      border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
    }
    .field-group input.invalid { border-color: #ef4444; }
    .field-error { font-size: 0.78rem; color: #ef4444; }
    .color-picker { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .color-swatch {
      width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s; outline: none;
    }
    .color-swatch:hover { transform: scale(1.15); }
    .color-swatch.selected { border-color: white; box-shadow: 0 0 0 3px rgba(0,0,0,0.2); }
    .project-preview { background: #f8fafc; border-radius: 10px; padding: 1rem; }
    .preview-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }
    .preview-card { background: white; border-radius: 10px; padding: 1rem; border-top: 4px solid; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .preview-key { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.35rem; }
    .preview-name { font-size: 1rem; font-weight: 600; color: #0f172a; margin-bottom: 0.25rem; }
    .preview-desc { font-size: 0.8rem; color: #94a3b8; }
    .error-alert { padding: 0.75rem 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.9rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
    .btn-ghost { padding: 0.65rem 1.25rem; background: none; border: 1.5px solid #e2e8f0; color: #374151; border-radius: 8px; font-weight: 500; cursor: pointer; text-decoration: none; font-size: 0.9rem; }
    .btn-primary {
      display: flex; align-items: center; gap: 0.4rem; padding: 0.65rem 1.5rem;
      background: #6366f1; color: white; border: none; border-radius: 8px;
      font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.15s;
    }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ProjectFormComponent {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  readonly colors = PROJECT_COLORS;
  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    key: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10),
      Validators.pattern(/^[A-Z0-9]+$/)]],
    description: [''],
    color: ['#6366f1']
  });

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c?.invalid && !!c?.touched;
  }

  autoGenerateKey(): void {
    const name = this.form.get('name')?.value || '';
    if (name && !this.form.get('key')?.dirty) {
      const key = name
        .split(/\s+/)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 5);
      this.form.get('key')?.setValue(key);
    }
  }

  uppercaseKey(): void {
    const ctrl = this.form.get('key');
    const val = ctrl?.value || '';
    ctrl?.setValue(val.toUpperCase().replace(/[^A-Z0-9]/g, ''), { emitEvent: false });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.serverError.set(null);

    this.projectService.createProject(this.form.value as any).subscribe({
      next: project => {
        this.notify.success(`Project "${project.name}" created!`);
        this.router.navigate(['/projects', project.id, 'board']);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.serverError.set(err.error?.message || 'Failed to create project');
      }
    });
  }
}
