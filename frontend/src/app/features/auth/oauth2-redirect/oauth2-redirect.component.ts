import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:1rem;">
      <div class="spinner"></div>
      <p style="color:#64748b">Completing sign in...</p>
    </div>
  `,
  styles: [`.spinner { width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite; } @keyframes spin{to{transform:rotate(360deg)}}`]
})
export class OAuth2RedirectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authState = inject(AuthStateService);
  private userService = inject(UserService);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');

    if (token && refreshToken) {
      this.authState.setTokens(token, refreshToken);
      this.userService.getCurrentUser().subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => this.router.navigate(['/auth/login'])
      });
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
