import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';
import { LanguageService } from '../../core/language.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authSpy: any;
  let router: Router;
  let navigateSpy: jasmine.Spy;
  let googleInit: jasmine.Spy;
  let googleRender: jasmine.Spy;

  beforeEach(async () => {
    // Mock Google SDK
    googleInit = jasmine.createSpy('googleInit');
    googleRender = jasmine.createSpy('googleRender');
    (window as any).google = {
      accounts: {
        id: {
          initialize: googleInit,
          renderButton: googleRender,
        },
      },
    };

    authSpy = {
      signin: jasmine.createSpy('signin').and.returnValue(of({})),
      signinGoogle: jasmine.createSpy('signinGoogle').and.returnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: AuthService, useValue: authSpy },
        { provide: LanguageService, useValue: { t: (k: string) => k } },
      ],
    }).compileComponents();
    
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.stub();
    fixture.detectChanges();
  });

  afterEach(() => {
    delete (window as any).google;
    googleInit.calls.reset();
    googleRender.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit valid form and navigate', () => {
    component.loginForm.setValue({ email: 'test@example.com', password: 'secret' });
    component.onSubmit();

    expect(authSpy.signin).toHaveBeenCalledWith({ email: 'test@example.com', password: 'secret' });
    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
  });

  it('should render Google button when SDK is ready', fakeAsync(() => {
    expect(googleInit).toHaveBeenCalled();
    tick(); // flush setTimeout(0) inside render call
    expect(googleRender).toHaveBeenCalled();
  }));

  it('should handle Google sign-in and navigate', () => {
    component.handleGoogleSignIn({ credential: 'abc123' });

    expect(authSpy.signinGoogle).toHaveBeenCalledWith('abc123');
    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
  });
});
