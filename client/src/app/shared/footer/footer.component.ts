import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="app-footer">
      <div class="left">© 2025 Grupo 18</div>
      <div class="right">{{ lang.t('footerRight') }}</div>
    </footer>
  `,
  styles: [
    `
      .app-footer {
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:12px 24px;
        border-top:1px solid rgba(0,0,0,0.08);
        color: rgba(0,0,0,0.6);
        background: transparent;
        font-size:0.9rem;
      }
      @media (max-width:600px){ .app-footer{ flex-direction:column; gap:6px; text-align:center }}
    `,
  ],
})
export class FooterComponent {
  constructor(public lang: LanguageService) {}
}
