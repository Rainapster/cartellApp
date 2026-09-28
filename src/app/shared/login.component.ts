import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../service/auth.service';
import { StorageService } from '../service/storage';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="d-flex flex-column container_login">
      <div class="login" *ngIf="!auth.isLoggedIn()" (keydown.enter)="login()">
        <p>Inserisci le tue credenziali</p>
        <input type="email" [(ngModel)]="email" placeholder="Email" />
        <input type="password" [(ngModel)]="password" placeholder="Password" />
        <button (click)="login()">Accedi</button>
      </div>
      <div class="login" *ngIf="auth.isLoggedIn()">
        <p>Scegli il file dei dati</p>
        <button *ngIf="savedFileName" (click)="reconnect()">Apri {{ savedFileName }}</button>
        <button (click)="openFile()">Apri un altro file</button>
        <button (click)="createFile()">Crea nuovo file</button>
      </div>
      <p *ngIf="errorMessage" class="text-danger">{{ errorMessage }}</p>
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
export class LoginComponent implements OnInit {
  auth = inject(AuthService);
  private storage = inject(StorageService);
  private router = inject(Router);

  email: string = '';
  password: string = '';
  errorMessage: string | null = null;
  savedFileName: string | null = null;

  async ngOnInit() {
    this.savedFileName = await this.storage.savedFileName();
  }

  async login() {
    this.errorMessage = null;
    if (!(await this.auth.login(this.email, this.password))) {
      this.errorMessage = 'Email o password errate';
      return;
    }
    if (this.savedFileName) await this.reconnect();
  }

  reconnect() {
    return this.run(() => this.storage.reconnect());
  }
  openFile() {
    return this.run(() => this.storage.openFile());
  }
  createFile() {
    return this.run(() => this.storage.createFile());
  }

  private async run(action: () => Promise<boolean>) {
    this.errorMessage = null;
    try {
      if (await action()) this.router.navigate(['home']);
    } catch (e: any) {
      // AbortError = l'utente ha chiuso la finestra di scelta del file
      if (e?.name !== 'AbortError') {
        console.error(e);
        this.errorMessage = 'Impossibile aprire il file';
      }
    }
  }
}
