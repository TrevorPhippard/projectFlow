import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Project, ProjectMember } from '../../../shared/models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="members-page">
      <div class="members-header">
        <div>
          <h2>Team Members</h2>
          <p>{{ members().length }} member{{ members().length !== 1 ? 's' : '' }}</p>
        </div>
        <button class="btn-primary" (click)="showInvite.set(true)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Invite Member
        </button>
      </div>

      @if (showInvite()) {
        <div class="invite-card">
          <h3>Invite Team Member</h3>
          <div class="invite-form">
            <input type="email" [(ngModel)]="inviteEmail" placeholder="colleague@company.com" class="invite-input" />
            <select [(ngModel)]="inviteRole" class="role-select">
              <option value="VIEWER">Viewer</option>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <div class="invite-actions">
              <button class="btn-ghost" (click)="showInvite.set(false); inviteEmail = ''">Cancel</button>
              <button class="btn-primary" [disabled]="inviting() || !inviteEmail" (click)="inviteMember()">
                @if (inviting()) { <span class="spinner-xs"></span> }
                Send Invite
              </button>
            </div>
          </div>
          @if (inviteError()) {
            <div class="error-msg">{{ inviteError() }}</div>
          }
        </div>
      }

      @if (loading()) {
        <div class="skeleton-list">
          @for (i of [1,2,3]; track i) { <div class="skeleton-row"></div> }
        </div>
      } @else {
        <div class="members-list">
          @for (member of members(); track member.id) {
            <div class="member-card">
              <div class="member-avatar" [style.background]="getColor(member.user.id)">
                @if (member.user.avatarUrl) {
                  <img [src]="member.user.avatarUrl" [alt]="member.user.fullName || ''" />
                } @else {
                  {{ (member.user.fullName || member.user.username)[0].toUpperCase() }}
                }
              </div>
              <div class="member-info">
                <div class="member-name">{{ member.user.fullName || member.user.username }}</div>
                <div class="member-email">{{ member.user.email }}</div>
                <div class="member-joined">Joined {{ member.joinedAt | date:'MMM d, y' }}</div>
              </div>
              <div class="member-role-area">
                @if (isCurrentUser(member) || !canManage()) {
                  <span class="role-badge" [class]="member.role.toLowerCase()">{{ member.role }}</span>
                } @else {
                  <select class="role-select-inline" [value]="member.role"
                    (change)="updateRole(member, $any($event.target).value)">
                    <option value="VIEWER">Viewer</option>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button class="remove-btn" (click)="removeMember(member)" title="Remove member">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .members-page { padding: 1.5rem; max-width: 760px; }
    .members-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
    .members-header h2 { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.2rem; }
    .members-header p { color: #64748b; font-size: 0.875rem; margin: 0; }
    .btn-primary { display: flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1.1rem; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.15s; }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
    .invite-card { background: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem; border: 1.5px solid #e0e7ff; box-shadow: 0 1px 4px rgba(99,102,241,0.1); }
    .invite-card h3 { font-size: 0.95rem; font-weight: 600; color: #1e293b; margin: 0 0 1rem; }
    .invite-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .invite-input, .role-select { padding: 0.6rem 0.875rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; outline: none; font-family: inherit; }
    .invite-input:focus, .role-select:focus { border-color: #6366f1; }
    .invite-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .btn-ghost { padding: 0.55rem 1rem; background: none; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; cursor: pointer; color: #374151; }
    .error-msg { color: #dc2626; font-size: 0.85rem; margin-top: 0.5rem; }
    .members-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .member-card { background: white; border-radius: 12px; padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 1rem; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .member-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; color: white; flex-shrink: 0; overflow: hidden; }
    .member-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .member-info { flex: 1; }
    .member-name { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
    .member-email { font-size: 0.8rem; color: #64748b; }
    .member-joined { font-size: 0.75rem; color: #94a3b8; margin-top: 0.1rem; }
    .member-role-area { display: flex; align-items: center; gap: 0.5rem; }
    .role-badge { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; padding: 0.25rem 0.6rem; border-radius: 6px; }
    .role-badge.admin { background: #ede9fe; color: #7c3aed; }
    .role-badge.member { background: #dbeafe; color: #1d4ed8; }
    .role-badge.viewer { background: #f1f5f9; color: #64748b; }
    .role-badge.owner { background: #fef3c7; color: #d97706; }
    .role-select-inline { padding: 0.3rem 0.6rem; border: 1.5px solid #e2e8f0; border-radius: 6px; font-size: 0.8rem; outline: none; cursor: pointer; }
    .remove-btn { width: 28px; height: 28px; border: none; background: none; cursor: pointer; color: #94a3b8; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.15s; }
    .remove-btn:hover { background: #fee2e2; color: #dc2626; }
    .spinner-xs { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .skeleton-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .skeleton-row { height: 72px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
    @keyframes shimmer { to { background-position: -200% 0; } }
  `]
})
export class ProjectMembersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private authState = inject(AuthStateService);
  private notify = inject(NotificationService);

  readonly members = signal<ProjectMember[]>([]);
  readonly loading = signal(true);
  readonly showInvite = signal(false);
  readonly inviting = signal(false);
  readonly inviteError = signal<string | null>(null);
  readonly canManage = signal(false);

  inviteEmail = '';
  inviteRole = 'MEMBER';
  private projectId = 0;

  ngOnInit(): void {
    this.projectId = Number(this.route.parent?.snapshot.paramMap.get('id'));
    this.loadProject();
  }

  loadProject(): void {
    this.projectService.getProject(this.projectId).subscribe({
      next: project => {
        this.members.set(project.members);
        const currentUserId = this.authState.user()?.id;
        const myMembership = project.members.find(m => m.user.id === currentUserId);
        this.canManage.set(
          project.owner.id === currentUserId ||
          myMembership?.role === 'ADMIN' ||
          this.authState.isAdmin()
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  inviteMember(): void {
    if (!this.inviteEmail.trim()) return;
    this.inviting.set(true);
    this.inviteError.set(null);

    this.projectService.inviteMember(this.projectId, this.inviteEmail, this.inviteRole).subscribe({
      next: project => {
        this.members.set(project.members);
        this.inviting.set(false);
        this.showInvite.set(false);
        this.inviteEmail = '';
        this.notify.success('Member invited successfully');
      },
      error: err => {
        this.inviteError.set(err.error?.message || 'Failed to invite member');
        this.inviting.set(false);
      }
    });
  }

  updateRole(member: ProjectMember, newRole: string): void {
    this.projectService.updateMemberRole(this.projectId, member.id, newRole).subscribe({
      next: project => {
        this.members.set(project.members);
        this.notify.success('Role updated');
      },
      error: () => this.notify.error('Failed to update role')
    });
  }

  removeMember(member: ProjectMember): void {
    if (!confirm(`Remove ${member.user.fullName || member.user.username} from this project?`)) return;

    this.projectService.removeMember(this.projectId, member.id).subscribe({
      next: () => {
        this.members.update(m => m.filter(x => x.id !== member.id));
        this.notify.success('Member removed');
      },
      error: () => this.notify.error('Failed to remove member')
    });
  }

  isCurrentUser(member: ProjectMember): boolean {
    return member.user.id === this.authState.user()?.id;
  }

  getColor(id: number): string {
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[id % colors.length];
  }
}
