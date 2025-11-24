import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { LanguageService } from '../core/language.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatCardModule],
  template: `
    <div class="landing-wrap">
      <mat-card class="intro-card">
        <mat-card-title>{{ lang.t('landingTitle') }}</mat-card-title>
        <mat-card-content>
          <p>{{ lang.t('landingSubtitle') }}</p>
          <div class="actions">
            <button mat-flat-button color="primary" routerLink="/login">{{ lang.t('login') }}</button>
            <button mat-stroked-button color="primary" routerLink="/register">{{ lang.t('register') }}</button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .landing-wrap{display:flex;align-items:center;justify-content:center;padding:48px}
      .intro-card{max-width:780px;text-align:center;padding:24px}
      .actions{display:flex;gap:12px;justify-content:center;margin-top:16px}
    `,
  ],
})
export class LandingComponent {
  constructor(public lang: LanguageService) {}
}
