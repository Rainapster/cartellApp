import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-light bg-light">
      <div class="d-flex align-items-center">
        <img src="logo.png" width="100" height="100" alt="Logo" />
      </div>

      <a class="nav-link me-1" routerLink="/home" routerLinkActive="active"
        >Home</a
      >
      <a class="nav-link me-1" routerLink="/riepilogo" routerLinkActive="active"
        >Statistiche</a
      >
      <a class="nav-link me-1" routerLink="/spese" routerLinkActive="active"
        >Spese</a
      >
      <button class="btn logout-btn" (click)="logout()">Logout</button>
    </nav>
  `,
  styles: `
  .navbar {
  padding: 1rem;
}
.navbar-brand img {
  margin-right: 0.5rem;
}
.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.logout-btn {
  background-color: #dc3545; 
  color: #fff;
}

.logout-btn:hover {
  background-color: #c82333;
  transform: translateY(-2px);
}
`,
})
export class NavbarComponent {
  router = inject(Router);
  logout() {
    localStorage.removeItem('authToken');
    this.router.navigate(['login']);
  }
}
