import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartellaComponent } from './cartella.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CartellaComponent],
  template: `
    <h1 class="title">
      {{ title }}
    </h1>
    <h3 class="subtitle">
      {{ subtitle }}
    </h3>
    <div class="button-container">
      <button class="btn preventivo-btn" (click)="preventivo()">
        Stampa Cartella o Preventivo
      </button>
    </div>
    <div class="cartella-container">
      <app-cartella />
    </div>
  `,
  styles: `
  /* Stile per il titolo */
.title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  color: #0d6efd; /* Blu primario */
  margin-bottom: 1rem;
}

/* Stile per il sottotitolo */
.subtitle {
  font-size: 1.5rem;
  text-align: center;
  color: #495057; /* Grigio scuro */
  margin-bottom: 2rem;
}

/* Contenitore per i pulsanti */
.button-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

/* Stile uniforme per i pulsanti */
.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}


.preventivo-btn {
  background-color: #0d6efd; 
  color: #fff;
}

.preventivo-btn:hover {
  background-color: #0b5ed7;
  transform: translateY(-2px);
}

.cartella-container {
  margin: 2rem auto;
  max-width: 800px;
}
  `,
})
export class HomeComponent {
  title = 'CartellApp!';
  subtitle = "L'app del commesso";
  router = inject(Router);
  preventivo() {
    this.router.navigate(['search']);
  }
}
