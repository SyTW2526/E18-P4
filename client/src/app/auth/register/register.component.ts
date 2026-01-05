import { Component, OnInit, AfterViewInit, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { LanguageService } from '../../core/language.service';

// Importaciones de Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'] // Puedes reusar el CSS de login
})
export class RegisterComponent implements OnInit, AfterViewInit {
  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  loading = false;
  error: string | null = null;
  googleReady = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    public lang: LanguageService,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.initGoogleSignIn();
  }

  ngAfterViewInit() {
    if (this.googleReady) {
      this.renderGoogleButton();
    }
  }

  private initGoogleSignIn() {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip Google Sign-In initialization on server
    }

    if ((window as any).google && (window as any).google.accounts) {
      (window as any).google.accounts.id.initialize({
        client_id: '642232939098-94193hhr1jgcduddpujmhfq4snomrruk.apps.googleusercontent.com',
        callback: this.handleGoogleSignIn.bind(this),
      });
      this.googleReady = true;
      // Render button immediately after initialization
      setTimeout(() => this.renderGoogleButton(), 0);
      return;
    }

    // If Google not loaded, load the script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google && (window as any).google.accounts) {
        (window as any).google.accounts.id.initialize({
          client_id: '642232939098-94193hhr1jgcduddpujmhfq4snomrruk.apps.googleusercontent.com',
          callback: this.handleGoogleSignIn.bind(this),
        });
        this.googleReady = true;
        setTimeout(() => this.renderGoogleButton(), 0);
      }
    };
    document.head.appendChild(script);
  }

  private renderGoogleButton() {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip rendering on server
    }

    const buttonDiv = document.getElementById('google-signin-button-register');
    if (buttonDiv && (window as any).google && (window as any).google.accounts) {
      try {
        (window as any).google.accounts.id.renderButton(
          buttonDiv,
          { theme: 'outline', size: 'large', text: 'signup_with' }
        );
      } catch (e) {
        console.error('Error rendering Google button:', e);
      }
    }
  }

  handleGoogleSignIn(response: any) {
    const token = response.credential;
    if (token) {
      this.error = null;
      this.loading = true;
      this.ngZone.run(() => {
        this.auth.signinGoogle(token).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/home']);
          },
          error: (e) => {
            this.loading = false;
            this.error = e?.error?.message || 'Error al registrarse con Google';
          },
        });
      });
    }
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.error = null;
      this.loading = true;
      const payload = {
        nombre: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password
      };
      this.auth.signup(payload as any).subscribe({
        next: () => {
          this.loading = false;
          // Check for pending invitation link
          const pendingToken = sessionStorage.getItem('pendingInviteToken');
          if (pendingToken) {
            this.router.navigate(['/join-group', pendingToken]);
          } else {
            this.router.navigate(['/home']);
          }
        },
        error: (e) => {
          this.loading = false;
          // If backend indicates conflict (email exists)
          if (e?.status === 409) {
            this.error = 'Ya existe un usuario con ese correo.';
          } else if (typeof e?.error === 'string' && e?.error.length) {
            this.error = e.error;
          } else {
            this.error = e?.error?.message || e?.message || 'Error al registrarse';
          }
          console.error('signup error', e);
        }
      });
    }
  }
}