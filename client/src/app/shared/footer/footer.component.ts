import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="app-footer">
      <div class="footer-inner">
        <p class="footer-tagline">{{ lang.t('footerTagline') }}</p>
        <div class="footer-divider" aria-hidden="true"></div>
        <div class="footer-social" aria-label="Redes sociales">
          <a
            class="social-button"
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Facebook"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M15 8.5h-2V7.1c0-.6.3-.9 1-.9h1V4h-2.5C9.9 4 9 5.6 9 7.1V8.5H7v2.6h2V20h4v-8.9h2.1L15 8.5Z" />
            </svg>
          </a>
          <a
            class="social-button"
            href="https://www.instagram.com"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2c-1.7 0-3 .3-3.8 1.2C3.3 6.9 3 8.3 3 10v4c0 1.7.3 3.1 1.2 4C5 18.9 6.3 19 8 19h8c1.7 0 3-.1 3.8-1 1-.9 1.2-2.3 1.2-4v-4c0-1.7-.2-3.1-1.2-4C18.9 5.3 17.7 5 16 5Zm8 2.1a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2.1A1.9 1.9 0 1 0 14 12a1.9 1.9 0 0 0-2-1.9Z" />
            </svg>
          </a>
          <a
            class="social-button"
            href="https://x.com"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="X"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 4h4l3 4 3.5-4H19l-4.6 5.2L19 20h-4l-3.2-4.6L8 20H5l5-5.8Z" />
            </svg>
          </a>
        </div>
        <div class="footer-meta">
          <span class="footer-brand">{{ lang.t('footerBrand') }}</span>
          <span class="footer-year">© {{ currentYear }}</span>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .app-footer {
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 48px 24px 56px;
        margin-top: 48px;
        color: #0f172a;
        background: #ffffff;
        box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06);
        position: relative;
        z-index: 5;
      }

      .footer-inner {
        width: min(960px, 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        text-align: center;
      }

      .footer-tagline {
        font-size: 1.12rem;
        font-weight: 700;
        letter-spacing: 0.01em;
        margin: 0;
        color: #0f172a;
      }

      .footer-divider {
        width: min(700px, 90vw);
        height: 1px;
        background: #e2e8f0;
      }

      .footer-social {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
      }

      .social-button {
        width: 46px;
        height: 46px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 1.5px solid #0f172a;
        color: #0f172a;
        background: transparent;
        transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      }

      .social-button:hover {
        transform: translateY(-2px);
        background: #f8fafc;
        border-color: #111827;
        color: #111827;
      }

      .social-button svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
      }

      .footer-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.95rem;
        color: #475569;
      }

      .footer-brand {
        font-weight: 600;
        color: #0f172a;
      }

      @media (max-width: 640px) {
        .app-footer {
          padding: 40px 16px 48px;
          margin-top: 32px;
        }

        .footer-social {
          gap: 10px;
        }

        .social-button {
          width: 42px;
          height: 42px;
        }
      }
    `,
  ],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  constructor(public lang: LanguageService) {}
}
