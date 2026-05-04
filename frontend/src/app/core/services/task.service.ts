import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Task, CreateTaskRequest, UpdateTaskRequest, UpdatePositionRequest,
  KanbanBoard, PageResponse, TaskComment
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getKanbanBoard(projectId: number): Observable<KanbanBoard> {
    return this.http.get<KanbanBoard>(`${this.apiUrl}/projects/${projectId}/board`);
  }

  getTasks(projectId: number, filters?: {
    status?: string; priority?: string; assigneeId?: number; search?: string;
    page?: number; size?: number;
  }): Observable<PageResponse<Task>> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params = params.set(k, v);
      });
    }
    return this.http.get<PageResponse<Task>>(`${this.apiUrl}/projects/${projectId}/tasks`, { params });
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`);
  }

  createTask(projectId: number, request: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/projects/${projectId}/tasks`, request);
  }

  updateTask(id: number, request: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, request);
  }

  updatePosition(id: number, request: UpdatePositionRequest): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}/position`, request);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`);
  }

  getMyTasks(page = 0, size = 20): Observable<PageResponse<Task>> {
    return this.http.get<PageResponse<Task>>(`${this.apiUrl}/tasks/my`, {
      params: new HttpParams().set('page', page).set('size', size)
    });
  }

  getComments(taskId: number): Observable<PageResponse<TaskComment>> {
    return this.http.get<PageResponse<TaskComment>>(`${this.apiUrl}/tasks/${taskId}/comments`);
  }

  addComment(taskId: number, content: string): Observable<TaskComment> {
    return this.http.post<TaskComment>(`${this.apiUrl}/tasks/${taskId}/comments`, { content });
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${commentId}`);
  }
}
