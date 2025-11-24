import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type Lang = 'es' | 'en';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  es: {
    appTitle: 'PaySplit',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    settings: 'Configuración',
    enter: 'Entrar',
    landingTitle: 'Bienvenido a PaySplit',
    landingSubtitle: 'Gestiona gastos compartidos de forma simple y eficiente.',
    start: 'Comenzar',
    footerRight: 'Hecho con Angular y Node.js',
    emailLabel: 'Email',
    passwordLabel: 'Contraseña',
    emailError: 'Por favor, introduce un email válido.',
    passwordError: 'La contraseña es obligatoria.',
    entering: 'Entrando...',
    noAccount: '¿No tienes cuenta? Regístrate',
  },
  en: {
    appTitle: 'PaySplit',
    login: 'Login',
    register: 'Register',
    settings: 'Settings',
    enter: 'Enter',
    landingTitle: 'Welcome to PaySplit',
    landingSubtitle: 'Manage shared expenses simply and efficiently.',
    start: 'Get Started',
    footerRight: 'Made with Angular and Node.js',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    emailError: 'Please enter a valid email.',
    passwordError: 'Password is required.',
    entering: 'Signing in...',
    noAccount: "Don't have an account? Register",
  },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private lang$ = new BehaviorSubject<Lang>('es');

  get current() {
    return this.lang$.value;
  }

  get changes() {
    return this.lang$.asObservable();
  }

  toggle() {
    const next: Lang = this.current === 'es' ? 'en' : 'es';
    this.lang$.next(next);
  }

  t(key: string) {
    return TRANSLATIONS[this.current][key] ?? key;
  }
}
