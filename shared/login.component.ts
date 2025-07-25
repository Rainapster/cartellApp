import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="d-flex flex-column container_login" (keydown.enter)="login()">
      <div class="login">
        <p>Inserisci le tue credenziali</p>
        <input type="email" [(ngModel)]="email" placeholder="Email" />
        <input type="password" [(ngModel)]="password" placeholder="Password" />
        <button (click)="login()">Accedi</button>
        <p *ngIf="errorMessage" class="text-danger">{{ errorMessage }}</p>
      </div>
    </div>
  `,
  styles: `

  .container_login{
    width: 100%;
    height: 100%;
    align-items:center;
    justify-content: center;
  }
  .login{
    display: flex;
    flex-direction: column;
    width: 300px;
    height:auto;
  }
  `,
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string | null = null;
  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.http
      .post<{ token: string }>('http://localhost:3000/api/auth/login', {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (response) => {
          localStorage.setItem('token', response.token);
          this.router.navigate(['home']);
        },
        error: (err) => {
          if (err.status === 401) {
            this.errorMessage = 'Email o password errate';
          } else {
            this.errorMessage = 'Errore del server';
          }
        },
      });
  }
}
