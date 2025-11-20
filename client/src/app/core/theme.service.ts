import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storageKey = 'theme_preference';

  applyTheme(theme: 'dark' | 'light') {
    try {
      const body = document.body;
      if (theme === 'dark') {
        body.classList.add('app-dark-theme');
      } else {
        body.classList.remove('app-dark-theme');
      }
      localStorage.setItem(this.storageKey, theme);
    } catch (e) {
      // server-side or no DOM, ignore
    }
  }

  getStoredTheme(): 'dark' | 'light' | null {
    try {
      const v = localStorage.getItem(this.storageKey);
      return (v === 'dark' || v === 'light') ? v : null;
    } catch (e) {
      return null;
    }
  }
}
