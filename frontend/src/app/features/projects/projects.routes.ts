import { Routes } from '@angular/router';

export const projectRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./project-list/project-list.component').then(m => m.ProjectListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./project-form/project-form.component').then(m => m.ProjectFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./project-shell/project-shell.component').then(m => m.ProjectShellComponent),
    children: [
      { path: '', redirectTo: 'board', pathMatch: 'full' },
      {
        path: 'board',
        loadComponent: () => import('./kanban-board/kanban-board.component').then(m => m.KanbanBoardComponent)
      },
      {
        path: 'tasks',
        loadComponent: () => import('./task-list/task-list.component').then(m => m.TaskListComponent)
      },
      {
        path: 'members',
        loadComponent: () => import('./project-members/project-members.component').then(m => m.ProjectMembersComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./project-settings/project-settings.component').then(m => m.ProjectSettingsComponent)
      }
    ]
  }
];
