import { DOCUMENT } from '@angular/common';
import { Component, afterNextRender, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccesibilidadService } from './core/accesibilidad/accesibilidad.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  constructor() {
    // Aplica las preferencias de accesibilidad guardadas desde el primer momento
    const a11y = inject(AccesibilidadService);
    const html = inject(DOCUMENT).documentElement;
    // Secuencia de entrada del diseño (.js .intro → .loaded .intro); sin animación si se pidió reducirla
    if (!a11y.reducirMovimiento()) html.classList.add('js');
    afterNextRender(() => requestAnimationFrame(() => html.classList.add('loaded')));
  }
}
