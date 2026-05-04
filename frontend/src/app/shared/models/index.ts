// ===================== AUTH MODELS =====================
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  fullName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ===================== USER MODELS =====================
export interface UserSummary {
  id: number;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  roles?: string[];
}

export interface UserProfile extends UserSummary {
  bio?: string;
  provider: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===================== PROJECT MODELS =====================
export interface Project {
  id: number;
  name: string;
  description?: string;
  key: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  color: string;
  owner: UserSummary;
  members: ProjectMember[];
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: number;
  user: UserSummary;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  key: string;
  color?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  color?: string;
  status?: string;
}

// ===================== TASK MODELS =====================
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: number;
  projectKey: string;
  projectName: string;
  assignee?: UserSummary;
  reporter: UserSummary;
  dueDate?: string;
  position: number;
  storyPoints?: number;
  tags?: string[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number;
  dueDate?: string;
  storyPoints?: number;
  tags?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number;
  dueDate?: string;
  storyPoints?: number;
  tags?: string[];
}

export interface UpdatePositionRequest {
  status: TaskStatus;
  position: number;
}

export interface KanbanBoard {
  todo: Task[];
  inProgress: Task[];
  done: Task[];
}

export interface TaskComment {
  id: number;
  author: UserSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ===================== PAGINATION =====================
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ===================== API ERROR =====================
export interface ApiError {
  status: number;
  message: string;
  path: string;
  timestamp: string;
  details?: Record<string, string>;
}
