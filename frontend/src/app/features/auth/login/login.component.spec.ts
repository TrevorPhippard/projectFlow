import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterTestingModule, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show validation errors on empty submit', () => {
    component.form.get('email')?.markAsTouched();
    component.form.get('password')?.markAsTouched();
    fixture.detectChanges();
    expect(component.isInvalid('email')).toBeTrue();
  });

  it('should call AuthService.login on valid submit', () => {
    authServiceSpy.login.and.returnValue(of({
      accessToken: 'token', refreshToken: 'refresh',
      tokenType: 'Bearer', expiresIn: 900000,
      user: { id: 1, email: 'test@test.com', username: 'test', fullName: 'Test', roles: ['ROLE_USER'] }
    }));
    component.form.setValue({ email: 'test@test.com', password: 'Password1' });
    component.onSubmit();
    expect(authServiceSpy.login).toHaveBeenCalled();
  });

  it('should show error on failed login', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' }, status: 401 }))
    );
    component.form.setValue({ email: 'bad@test.com', password: 'wrongpass' });
    component.onSubmit();
    expect(component.error()).toContain('Invalid credentials');
  });
});
