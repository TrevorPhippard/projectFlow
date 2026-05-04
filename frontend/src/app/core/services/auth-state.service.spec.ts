import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthStateService } from './auth-state.service';

describe('AuthStateService', () => {
  let service: AuthStateService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [AuthStateService]
    });
    service = TestBed.inject(AuthStateService);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
  });

  it('should set tokens and user', () => {
    service.setTokens('access-token', 'refresh-token');
    service.setUser({ id: 1, email: 'test@test.com', username: 'test', fullName: 'Test User', roles: ['ROLE_USER'] });

    expect(service.accessToken()).toBe('access-token');
    expect(service.user()?.email).toBe('test@test.com');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should detect admin role', () => {
    service.setUser({ id: 1, email: 'admin@test.com', username: 'admin', fullName: 'Admin', roles: ['ROLE_ADMIN', 'ROLE_USER'] });
    expect(service.isAdmin()).toBeTrue();
  });

  it('should clear state on logout', () => {
    service.setTokens('token', 'refresh');
    service.setUser({ id: 1, email: 'test@test.com', username: 'test', fullName: 'Test', roles: [] });

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
    expect(localStorage.getItem('pf_access_token')).toBeNull();
  });

  it('should persist tokens to localStorage', () => {
    service.setTokens('my-access-token', 'my-refresh-token');
    expect(localStorage.getItem('pf_access_token')).toBe('my-access-token');
    expect(service.getRefreshToken()).toBe('my-refresh-token');
  });
});
