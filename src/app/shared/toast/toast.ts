import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AnunciadorService } from '../../core/ui/anunciador.service';
import { ToastService } from '../../core/ui/toast.service';

/** Aviso visual + región aria-live para lectores de pantalla. Va una sola vez en el layout. */
@Component({
  selector: 'app-avisos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sr-only" aria-live="polite" role="status">{{ anunciador.mensaje() }}</div>
    <div class="toast" [class.show]="toast.visible()" aria-hidden="true">{{ toast.mensaje() }}</div>
  `,
})
export class Avisos {
  protected toast = inject(ToastService);
  protected anunciador = inject(AnunciadorService);
}
