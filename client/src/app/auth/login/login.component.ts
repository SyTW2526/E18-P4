import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';

// Importaciones de Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  loading = false;
  error: string | null = null;

  constructor(private fb: FormBuilder, private router: Router, private auth: AuthService) {}

  onSubmit() {
    if (this.loginForm.valid) {
      this.error = null;
      this.loading = true;
      this.auth.signin(this.loginForm.value as any).subscribe({
        next: () => {
          this.loading = false;
          // go to protected home after login
          this.router.navigate(['/home']);
        },
        error: (e) => {
          this.loading = false;
          // Backend returns 401 for invalid credentials with plain text body
          if (e?.status === 401) {
            this.error = 'Correo o contraseña incorrectos.';
          } else if (typeof e?.error === 'string' && e?.error.length) {
            this.error = e.error;
          } else {
            this.error = e?.error?.message || e?.message || 'Error al iniciar sesión';
          }
          console.error('signin error', e);
        }
      });
    }
  }
}