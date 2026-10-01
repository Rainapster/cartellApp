import { Routes } from '@angular/router';
import { HomeComponent } from './features/home.component';
import { LoginComponent } from './shared/login.component';
import { SingleCartellaComponent } from './features/single-cartella.component';
import { RiepilogoComponent } from './features/riepilogo.component';
import { SpeseComponent } from './features/spese.component';
import { PreventiviComponent } from './features/preventivi.component';
import { authGuard } from './service/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'preventivi', component: PreventiviComponent, canActivate: [authGuard] },
  { path: 'search', component: SingleCartellaComponent, canActivate: [authGuard] },
  { path: 'riepilogo', component: RiepilogoComponent, canActivate: [authGuard] },
  { path: 'spese', component: SpeseComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];
