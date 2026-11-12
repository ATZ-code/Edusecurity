import { Injectable, inject, signal } from '@angular/core';
import { AnunciadorService } from './anunciador.service';

/** Aviso breve en la parte inferior de la pantalla (también se anuncia al lector de pantalla). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private anunciador = inject(AnunciadorService);
  readonly mensaje = signal('');
  readonly visible = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  mostrar(texto: string, duracionMs = 6000): void {
    this.mensaje.set(texto);
    this.visible.set(true);
    this.anunciador.anunciar(texto);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.visible.set(false), duracionMs);
  }
}
