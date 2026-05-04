import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <div class="auth-header">
        <h2>Welcome back</h2>
        <p>Sign in to your account to continue</p>
      </div>

      <a [href]="googleOAuthUrl" class="btn-oauth">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </a>

      <div class="divider"><span>or sign in with email</span></div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
        <div class="field-group">
          <label>Email address</label>
          <input type="email" formControlName="email" placeholder="you@example.com"
            [class.invalid]="isInvalid('email')" />
          @if (isInvalid('email')) {
            <span class="field-error">Please enter a valid email</span>
          }
        </div>

        <div class="field-group">
          <label>Password</label>
          <input type="password" formControlName="password" placeholder="••••••••"
            [class.invalid]="isInvalid('password')" />
          @if (isInvalid('password')) {
            <span class="field-error">Password is required</span>
          }
        </div>

        @if (error()) {
          <div class="error-alert">{{ error() }}</div>
        }

        <button type="submit" class="btn-primary" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> } Sign in
        </button>
      </form>

      <p class="auth-footer">
        Don't have an account? <a routerLink="/auth/register">Create one free</a>
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; max-width: 420px; }
    .auth-card { background: white; border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .auth-header { margin-bottom: 1.75rem; }
    .auth-header h2 { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin: 0 0 0.35rem; }
    .auth-header p { color: #64748b; margin: 0; }
    .btn-oauth {
      display: flex; align-items: center; justify-content: center; gap: 0.6rem;
      width: 100%; padding: 0.7rem 1rem; border: 1.5px solid #e2e8f0;
      border-radius: 10px; background: white; color: #1e293b; font-weight: 500;
      cursor: pointer; text-decoration: none; font-size: 0.95rem;
      transition: all 0.15s;
    }
    .btn-oauth:hover { background: #f8fafc; border-color: #cbd5e1; }
    .divider { position: relative; text-align: center; margin: 1.5rem 0; }
    .divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #e2e8f0; }
    .divider span { position: relative; background: white; padding: 0 1rem; color: #94a3b8; font-size: 0.85rem; }
    .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-group label { font-size: 0.875rem; font-weight: 500; color: #374151; }
    .field-group input {
      padding: 0.65rem 0.875rem; border: 1.5px solid #e2e8f0;
      border-radius: 8px; font-size: 0.95rem; transition: border-color 0.15s; outline: none;
    }
    .field-group input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .field-group input.invalid { border-color: #ef4444; }
    .field-error { font-size: 0.8rem; color: #ef4444; }
    .error-alert { padding: 0.75rem 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.9rem; }
    .btn-primary {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.75rem 1.5rem; background: #6366f1; color: white; border: none;
      border-radius: 10px; font-weight: 600; font-size: 0.95rem; cursor: pointer;
      transition: all 0.15s; margin-top: 0.5rem;
    }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .auth-footer { text-align: center; color: #64748b; font-size: 0.9rem; margin: 1.5rem 0 0; }
    .auth-footer a { color: #6366f1; font-weight: 500; text-decoration: none; }
    .auth-footer a:hover { text-decoration: underline; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);

  readonly googleOAuthUrl = environment.oauth2GoogleUrl;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl?.invalid && !!ctrl?.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);

    this.authService.login(this.form.value as any).subscribe({
      next: () => this.notify.success('Welcome back!'),
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Login failed. Please check your credentials.');
        this.loading.set(false);
      }
    });
  }
}
