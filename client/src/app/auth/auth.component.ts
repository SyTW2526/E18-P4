import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section style="max-width:600px; width:100%">
      <h2>Authentication</h2>
      <div *ngIf="auth.isLoggedIn()">
        <p>Logged as: {{ auth.getUser()?.nombre }} ({{ auth.getUser()?.email }})</p>
        <button (click)="logout()">Logout</button>
      </div>

      <div *ngIf="!auth.isLoggedIn()">
        <h3>Signup</h3>
        <form (ngSubmit)="signup()">
          <input placeholder="Nombre" [(ngModel)]="signupModel.nombre" name="nombre" />
          <input placeholder="Email" [(ngModel)]="signupModel.email" name="email" />
          <input placeholder="Password" [(ngModel)]="signupModel.password" name="password" type="password" />
          <button type="submit">Signup</button>
        </form>

        <h3>Signin</h3>
        <form (ngSubmit)="signin()">
          <input placeholder="Email" [(ngModel)]="signinModel.email" name="se_email" />
          <input placeholder="Password" [(ngModel)]="signinModel.password" name="se_password" type="password" />
          <button type="submit">Signin</button>
        </form>
      </div>
    </section>
  `,
})
export class AuthComponent {
  signupModel = { nombre: '', email: '', password: '' };
  signinModel = { email: '', password: '' };

  constructor(public auth: AuthService, private router: Router) {}

  signup() {
    this.auth.signup(this.signupModel).subscribe(() => this.router.navigate(['/']));
  }

  signin() {
    this.auth.signin(this.signinModel).subscribe(() => this.router.navigate(['/']));
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
