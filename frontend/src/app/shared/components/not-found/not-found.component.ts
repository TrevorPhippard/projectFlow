import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:1rem;background:#f8fafc;text-align:center;padding:2rem;">
      <div style="font-size:5rem">404</div>
      <h1 style="font-size:1.5rem;font-weight:700;color:#0f172a;margin:0">Page not found</h1>
      <p style="color:#64748b;margin:0">The page you're looking for doesn't exist.</p>
      <a routerLink="/dashboard" style="padding:0.65rem 1.5rem;background:#6366f1;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
        Go to Dashboard
      </a>
    </div>
  `
})
export class NotFoundComponent {}
