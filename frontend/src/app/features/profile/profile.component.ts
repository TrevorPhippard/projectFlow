import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserProfile } from '../../shared/models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <div class="page">
      <header class="page-header">
        <h1>My Profile</h1>
        <p class="subtitle">Manage your account settings and preferences</p>
      </header>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else if (profile()) {
        <div class="profile-grid">
          <!-- Avatar Card -->
          <div class="card avatar-card">
            <div class="avatar-display" [style.background]="getAvatarColor()">
              @if (profile()?.avatarUrl) {
                <img [src]="profile()!.avatarUrl" [alt]="profile()?.fullName || ''" class="avatar-img" />
              } @else {
                <span class="avatar-initial">{{ userInitial() }}</span>
              }
            </div>
            <h2 class="profile-name">{{ profile()?.fullName || profile()?.username }}</h2>
            <p class="profile-email">{{ profile()?.email }}</p>
            <div class="role-tags">
              @for (role of profile()?.roles; track role) {
                <span class="role-tag">{{ role.replace('ROLE_', '') }}</span>
              }
            </div>

            <label class="upload-btn" [class.uploading]="uploadingAvatar()">
              @if (uploadingAvatar()) { <span class="spinner-xs"></span> Uploading... }
              @else { 📷 Change Avatar }
              <input type="file" accept="image/*" (change)="onAvatarChange($event)" hidden />
            </label>

            <div class="joined-info">
              <span>Member since {{ profile()?.createdAt | date:'MMMM y' }}</span>
            </div>
          </div>

          <!-- Profile Form -->
          <div class="card">
            <h2 class="card-title">Personal Information</h2>
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <div class="field-group">
                <label>Full Name</label>
                <input formControlName="fullName" placeholder="Your full name" />
              </div>
              <div class="field-group">
                <label>Username</label>
                <input [value]="profile()?.username" disabled class="disabled-field" />
                <span class="field-hint">Username cannot be changed</span>
              </div>
              <div class="field-group">
                <label>Email</label>
                <input [value]="profile()?.email" disabled class="disabled-field" />
              </div>
              <div class="field-group">
                <label>Bio</label>
                <textarea formControlName="bio" rows="3" placeholder="Tell your team about yourself..."></textarea>
              </div>
              <div class="field-group">
                <label>Login Method</label>
                <div class="provider-badge">
                  @if (profile()?.provider === 'LOCAL') { 🔐 Email & Password }
                  @else { 🌐 {{ profile()?.provider }} OAuth }
                </div>
              </div>

              @if (profileSaveMsg()) {
                <div class="success-alert">{{ profileSaveMsg() }}</div>
              }

              <button type="submit" class="btn-primary" [disabled]="savingProfile()">
                @if (savingProfile()) { <span class="spinner-xs"></span> }
                Save Changes
              </button>
            </form>
          </div>

          <!-- Change Password -->
          @if (profile()?.provider === 'LOCAL') {
            <div class="card">
              <h2 class="card-title">Change Password</h2>
              <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                <div class="field-group">
                  <label>Current Password</label>
                  <input type="password" formControlName="currentPassword" placeholder="••••••••" />
                </div>
                <div class="field-group">
                  <label>New Password</label>
                  <input type="password" formControlName="newPassword" placeholder="Min 8 chars, A-Z, 0-9"
                    [class.invalid]="isPasswordInvalid('newPassword')" />
                  @if (isPasswordInvalid('newPassword')) {
                    <span class="field-error">Min 8 chars with uppercase, lowercase, and number</span>
                  }
                </div>
                @if (passwordError()) {
                  <div class="error-alert">{{ passwordError() }}</div>
                }
                @if (passwordSuccess()) {
                  <div class="success-alert">Password changed successfully!</div>
                }
                <button type="submit" class="btn-primary" [disabled]="savingPassword()">
                  @if (savingPassword()) { <span class="spinner-xs"></span> }
                  Change Password
                </button>
              </form>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem; }
    .subtitle { color: #64748b; margin: 0; }
    .loading { display: flex; justify-content: center; padding: 4rem; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .profile-grid { display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; align-items: start; }
    .card { background: white; border-radius: 14px; padding: 1.5rem; border: 1px solid #f1f5f9; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .card-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 1.25rem; }
    .avatar-card { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.75rem; }
    .avatar-display { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 700; color: white; overflow: hidden; }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-initial { font-size: 2.5rem; }
    .profile-name { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; }
    .profile-email { font-size: 0.85rem; color: #64748b; margin: 0; }
    .role-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center; }
    .role-tag { font-size: 0.72rem; font-weight: 600; background: #ede9fe; color: #7c3aed; padding: 0.2rem 0.5rem; border-radius: 5px; }
    .upload-btn {
      display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1rem;
      background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.85rem; font-weight: 500; cursor: pointer; color: #374151; transition: all 0.15s;
    }
    .upload-btn:hover { background: #f1f5f9; }
    .upload-btn.uploading { opacity: 0.7; cursor: not-allowed; }
    .joined-info { font-size: 0.78rem; color: #94a3b8; }
    form { display: flex; flex-direction: column; gap: 1rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .field-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
    .field-group input, .field-group textarea {
      padding: 0.6rem 0.875rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; outline: none; transition: border-color 0.15s; font-family: inherit;
    }
    .field-group input:focus, .field-group textarea:focus { border-color: #6366f1; }
    .field-group input.invalid { border-color: #ef4444; }
    .disabled-field { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
    .field-hint { font-size: 0.75rem; color: #94a3b8; }
    .field-error { font-size: 0.75rem; color: #ef4444; }
    .provider-badge { font-size: 0.875rem; color: #374151; background: #f8fafc; padding: 0.5rem 0.875rem; border-radius: 8px; border: 1px solid #e2e8f0; }
    .success-alert { padding: 0.7rem 1rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #16a34a; font-size: 0.875rem; }
    .error-alert { padding: 0.7rem 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 0.875rem; }
    .btn-primary { align-self: flex-start; display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.25rem; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.15s; }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
    .spinner-xs { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr; } }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authState = inject(AuthStateService);
  private notify = inject(NotificationService);

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly uploadingAvatar = signal(false);
  readonly profileSaveMsg = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal(false);

  profileForm = this.fb.group({
    fullName: [''],
    bio: ['']
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)]]
  });

  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe({
      next: p => {
        this.profile.set(p);
        this.profileForm.patchValue({ fullName: p.fullName, bio: p.bio || '' });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  userInitial(): string {
    const p = this.profile();
    return (p?.fullName || p?.username || '?')[0].toUpperCase();
  }

  getAvatarColor(): string {
    const id = this.profile()?.id || 1;
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[id % colors.length];
  }

  saveProfile(): void {
    this.savingProfile.set(true);
    this.profileSaveMsg.set(null);
    const { fullName, bio } = this.profileForm.value;
    this.userService.updateProfile(fullName || '', bio || undefined).subscribe({
      next: p => {
        this.profile.set(p);
        this.savingProfile.set(false);
        this.profileSaveMsg.set('Profile updated successfully');
        setTimeout(() => this.profileSaveMsg.set(null), 3000);
      },
      error: () => this.savingProfile.set(false)
    });
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingAvatar.set(true);
    this.userService.uploadAvatar(file).subscribe({
      next: p => {
        this.profile.set(p);
        this.uploadingAvatar.set(false);
        this.notify.success('Avatar updated');
      },
      error: err => {
        this.uploadingAvatar.set(false);
        this.notify.error(err.error?.message || 'Failed to upload avatar');
      }
    });
  }

  isPasswordInvalid(field: string): boolean {
    const c = this.passwordForm.get(field);
    return !!c?.invalid && !!c?.touched;
  }

  changePassword(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.savingPassword.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(false);
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.userService.changePassword(currentPassword!, newPassword!).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordSuccess.set(true);
        this.passwordForm.reset();
        setTimeout(() => this.passwordSuccess.set(false), 4000);
      },
      error: err => {
        this.savingPassword.set(false);
        this.passwordError.set(err.error?.message || 'Failed to change password');
      }
    });
  }
}
