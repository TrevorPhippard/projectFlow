import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

function passwordStrength(ctrl: AbstractControl): ValidationErrors | null {
  const v = ctrl.value || '';
  if (!v) return null;
  const hasUpper = /[A-Z]/.test(v);
  const hasLower = /[a-z]/.test(v);
  const hasNumber = /\d/.test(v);
  if (!hasUpper || !hasLower || !hasNumber) return { weak: true };
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <div class="auth-header">
        <h2>Create your account</h2>
        <p>Start managing projects like a pro</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
        <div class="field-group">
          <label>Full name</label>
          <input formControlName="fullName" placeholder="Jane Smith" />
        </div>

        <div class="field-group">
          <label>Email address</label>
          <input type="email" formControlName="email" placeholder="you@example.com"
            [class.invalid]="isInvalid('email')" />
          @if (isInvalid('email')) { <span class="field-error">Valid email required</span> }
        </div>

        <div class="field-group">
          <label>Username</label>
          <input formControlName="username" placeholder="janesmith"
            [class.invalid]="isInvalid('username')" />
          @if (isInvalid('username')) {
            <span class="field-error">3-30 characters, letters/numbers/_ only</span>
          }
        </div>

        <div class="field-group">
          <label>Password</label>
          <input type="password" formControlName="password" placeholder="Min 8 chars, A-Z, 0-9"
            [class.invalid]="isInvalid('password')" />
          @if (form.get('password')?.value) {
            <div class="password-strength">
              <div class="strength-bar">
                <div class="strength-fill" [style.width]="strengthWidth()" [style.background]="strengthColor()"></div>
              </div>
              <span class="strength-label" [style.color]="strengthColor()">{{ strengthLabel() }}</span>
            </div>
          }
          @if (isInvalid('password')) { <span class="field-error">Min 8 chars with uppercase, lowercase, number</span> }
        </div>

        @if (serverErrors()) {
          <div class="error-alert">
            @for (msg of serverErrorList(); track msg) { <div>{{ msg }}</div> }
          </div>
        }

        <button type="submit" class="btn-primary" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> } Create account
        </button>
      </form>

      <p class="auth-footer">
        Already have an account? <a routerLink="/auth/login">Sign in</a>
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; max-width: 420px; }
    .auth-card { background: white; border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .auth-header { margin-bottom: 1.75rem; }
    .auth-header h2 { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin: 0 0 0.35rem; }
    .auth-header p { color: #64748b; margin: 0; }
    .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-group label { font-size: 0.875rem; font-weight: 500; color: #374151; }
    .field-group input {
      padding: 0.65rem 0.875rem; border: 1.5px solid #e2e8f0;
      border-radius: 8px; font-size: 0.95rem; outline: none; transition: border-color 0.15s;
    }
    .field-group input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .field-group input.invalid { border-color: #ef4444; }
    .field-error { font-size: 0.8rem; color: #ef4444; }
    .password-strength { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; }
    .strength-bar { flex: 1; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; }
    .strength-fill { height: 100%; border-radius: 2px; transition: all 0.3s; }
    .strength-label { font-size: 0.75rem; font-weight: 500; white-space: nowrap; }
    .error-alert { padding: 0.75rem 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.9rem; }
    .btn-primary {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.75rem; background: #6366f1; color: white; border: none;
      border-radius: 10px; font-weight: 600; font-size: 0.95rem; cursor: pointer;
      transition: all 0.15s; margin-top: 0.5rem;
    }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .auth-footer { text-align: center; color: #64748b; font-size: 0.9rem; margin: 1.5rem 0 0; }
    .auth-footer a { color: #6366f1; font-weight: 500; text-decoration: none; }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);

  readonly loading = signal(false);
  readonly serverErrors = signal<Record<string, string> | null>(null);

  form = this.fb.group({
    fullName: [''],
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30),
      Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
    password: ['', [Validators.required, Validators.minLength(8), passwordStrength]]
  });

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!c?.invalid && !!c?.touched;
  }

  serverErrorList(): string[] {
    const e = this.serverErrors();
    if (!e) return [];
    return Object.values(e);
  }

  strengthWidth(): string {
    const p = this.form.get('password')?.value || '';
    const score = [p.length >= 8, /[A-Z]/.test(p), /[a-z]/.test(p), /\d/.test(p), /[^a-zA-Z0-9]/.test(p)]
      .filter(Boolean).length;
    return `${score * 20}%`;
  }

  strengthColor(): string {
    const p = this.form.get('password')?.value || '';
    const score = [p.length >= 8, /[A-Z]/.test(p), /[a-z]/.test(p), /\d/.test(p)].filter(Boolean).length;
    return score <= 1 ? '#ef4444' : score === 2 ? '#f97316' : score === 3 ? '#eab308' : '#22c55e';
  }

  strengthLabel(): string {
    const p = this.form.get('password')?.value || '';
    const score = [p.length >= 8, /[A-Z]/.test(p), /[a-z]/.test(p), /\d/.test(p)].filter(Boolean).length;
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][score] || '';
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.serverErrors.set(null);

    this.authService.register(this.form.value as any).subscribe({
      next: () => this.notify.success('Account created! Welcome to ProjectFlow.'),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.error?.details) this.serverErrors.set(err.error.details);
        else this.serverErrors.set({ general: err.error?.message || 'Registration failed' });
      }
    });
  }
}
