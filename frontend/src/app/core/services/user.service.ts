import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserProfile, UserSummary, PageResponse } from '../../shared/models';
import { AuthStateService } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private authState = inject(AuthStateService);
  private apiUrl = `${environment.apiUrl}/users`;

  getCurrentUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      tap(profile => this.authState.updateUser(profile))
    );
  }

  updateProfile(fullName: string, bio?: string): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/me`, { fullName, bio }).pipe(
      tap(profile => this.authState.updateUser(profile))
    );
  }

  uploadAvatar(file: File): Observable<UserProfile> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<UserProfile>(`${this.apiUrl}/me/avatar`, fd).pipe(
      tap(profile => this.authState.updateUser(profile))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/me/password`, { currentPassword, newPassword });
  }

  searchUsers(query: string, page = 0, size = 10): Observable<PageResponse<UserSummary>> {
    return this.http.get<PageResponse<UserSummary>>(`${this.apiUrl}/search`, {
      params: new HttpParams().set('query', query).set('page', page).set('size', size)
    });
  }

  getUserById(id: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${id}`);
  }
}
