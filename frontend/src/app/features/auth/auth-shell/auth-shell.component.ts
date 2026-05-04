import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-wrapper">
      <div class="auth-brand">
        <div class="brand-content">
          <div class="logo-mark">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="16" fill="white" fill-opacity="0.15"/>
              <path d="M14 20h12v4H14zM14 28h28v4H14zM14 36h20v4H14z" fill="white"/>
              <rect x="30" y="14" width="12" height="12" rx="2" fill="#a5f3fc"/>
            </svg>
          </div>
          <h1 class="brand-name">ProjectFlow</h1>
          <p class="brand-tagline">Ship faster. Stay organized.<br>Work smarter together.</p>
          <div class="features-list">
            <div class="feature-item">
              <span class="feature-icon">⚡</span>
              <span>Kanban boards with drag & drop</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">👥</span>
              <span>Real-time team collaboration</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <span>Progress tracking & analytics</span>
            </div>
          </div>
        </div>
      </div>
      <div class="auth-form-panel">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
    }
    .auth-brand {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
      overflow: hidden;
    }
    .auth-brand::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%);
      border-radius: 50%;
    }
    .auth-brand::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(165,243,252,0.15) 0%, transparent 70%);
      border-radius: 50%;
    }
    .brand-content { position: relative; z-index: 1; color: white; max-width: 400px; }
    .logo-mark { margin-bottom: 1.5rem; }
    .brand-name {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0 0 0.75rem;
      letter-spacing: -0.02em;
    }
    .brand-tagline {
      font-size: 1.15rem;
      opacity: 0.8;
      line-height: 1.6;
      margin-bottom: 2.5rem;
    }
    .features-list { display: flex; flex-direction: column; gap: 1rem; }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.95rem;
      opacity: 0.9;
    }
    .feature-icon { font-size: 1.2rem; }
    .auth-form-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #f8fafc;
    }
    @media (max-width: 768px) {
      .auth-wrapper { grid-template-columns: 1fr; }
      .auth-brand { display: none; }
    }
  `]
})
export class AuthShellComponent {}
