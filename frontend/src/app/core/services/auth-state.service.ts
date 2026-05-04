import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserSummary, UserProfile } from '../../shared/models';

const ACCESS_TOKEN_KEY = 'pf_access_token';
const REFRESH_TOKEN_KEY = 'pf_refresh_token';
const USER_KEY = 'pf_user';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private router = inject(Router);

  private _user = signal<UserSummary | null>(this.loadUserFromStorage());
  private _accessToken = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));

  readonly user = this._user.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken() && !!this._user());
  readonly isAdmin = computed(() => this._user()?.roles?.includes('ROLE_ADMIN') ?? false);

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    this._accessToken.set(accessToken);
  }

  setUser(user: UserSummary): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  updateUser(profile: UserProfile): void {
    const summary: UserSummary = {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      roles: profile.roles
    };
    this.setUser(summary);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this._accessToken.set(null);
    this.router.navigate(['/auth/login']);
  }

  private loadUserFromStorage(): UserSummary | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
