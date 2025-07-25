import { Routes } from '@angular/router';
import { HomeComponent } from './features/home.component';
import { LoginComponent } from './shared/login.component';
import { SingleCartellaComponent } from './features/single-cartella.component';
import { RiepilogoComponent } from './features/riepilogo.component';
import { SpeseComponent } from './features/spese.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'search', component: SingleCartellaComponent },
  { path: 'riepilogo', component: RiepilogoComponent },
  { path: 'spese', component: SpeseComponent },
  { path: '**', redirectTo: 'login' },
];
