import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../auth.service';
import { LanguageService } from '../../core/language.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authSpy: any;
  let router: Router;
  let navigateSpy: jasmine.Spy;
  let googleInit: jasmine.Spy;
  let googleRender: jasmine.Spy;

  beforeEach(async () => {
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
      signup: jasmine.createSpy('signup').and.returnValue(of({})),
      signinGoogle: jasmine.createSpy('signinGoogle').and.returnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        RouterTestingModule,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
        { provide: AuthService, useValue: authSpy },
        { provide: LanguageService, useValue: { t: (k: string) => k } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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
    component.registerForm.setValue({
      username: 'User',
      email: 'user@example.com',
      password: '123456',
    });
    component.onSubmit();

    expect(authSpy.signup).toHaveBeenCalledWith({
      nombre: 'User',
      email: 'user@example.com',
      password: '123456',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
  });

  it('should render Google button when SDK is ready', fakeAsync(() => {
    expect(googleInit).toHaveBeenCalled();
    tick();
    expect(googleRender).toHaveBeenCalled();
  }));

  it('should handle Google sign-in and navigate', () => {
    component.handleGoogleSignIn({ credential: 'abc123' });

    expect(authSpy.signinGoogle).toHaveBeenCalledWith('abc123');
    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
  });
});
