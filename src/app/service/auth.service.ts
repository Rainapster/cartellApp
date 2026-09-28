import { Injectable } from '@angular/core';

// Per cambiare password: calcola lo SHA-256 della nuova password e incollalo qui
const EMAIL = 'prova@prova.it';
const PASSWORD_HASH = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';
const SESSION_KEY = 'cartellapp-auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLoggedIn(): boolean {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  async login(email: string, password: string): Promise<boolean> {
    const ok = email.trim().toLowerCase() === EMAIL && (await sha256(password)) === PASSWORD_HASH;
    if (ok) sessionStorage.setItem(SESSION_KEY, '1');
    return ok;
  }

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

async function sha256(text: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
