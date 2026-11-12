import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';
import { AccesibilidadService } from '../../core/accesibilidad/accesibilidad.service';

/**
 * Aparición al desplazarse (una sola vez), como en la muestra (.rv → .rv.in).
 * Uso: <h2 class="rv" appRevelar style="--d:.08s">…</h2>
 * El elemento es visible si no hay JavaScript o si se pidió reducir animaciones.
 */
@Directive({ selector: '[appRevelar]' })
export class Revelar {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const a11y = inject(AccesibilidadService);
    afterNextRender(() => {
      if (a11y.reducirMovimiento() || !('IntersectionObserver' in window)) {
        el.classList.add('in');
        return;
      }
      const obs = new IntersectionObserver(
        (es) => {
          if (es.some((e) => e.isIntersecting)) {
            el.classList.add('in');
            obs.disconnect();
          }
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
      );
      obs.observe(el);
    });
  }
}
