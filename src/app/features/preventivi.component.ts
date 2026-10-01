import { Component } from '@angular/core';
import { CartellaComponent } from './cartella.component';

@Component({
  selector: 'app-preventivi',
  imports: [CartellaComponent],
  template: `
    <h1 class="title">Preventivi</h1>
    <div class="cartella-container">
      <app-cartella modalita="preventivi" />
    </div>
  `,
  styles: `
.title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  color: #0d6efd;
  margin-bottom: 1rem;
}

.cartella-container {
  margin: 2rem auto;
  max-width: 800px;
}
  `,
})
export class PreventiviComponent {}
