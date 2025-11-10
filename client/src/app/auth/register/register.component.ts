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
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'] // Puedes reusar el CSS de login
})
export class RegisterComponent {
  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  loading = false;
  error: string | null = null;

  constructor(private fb: FormBuilder, private router: Router, private auth: AuthService) {}

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
          // after signup the user is usually logged in (token saved by service)
          this.router.navigate(['/home']);
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