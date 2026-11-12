import { Injectable, signal } from '@angular/core';

/**
 * Mensajes para lectores de pantalla (región aria-live del layout).
 * Úsalo cuando algo cambie sin que el foco se mueva: "Evaluación lista", "Texto al 125 %", etc.
 */
@Injectable({ providedIn: 'root' })
export class AnunciadorService {
  readonly mensaje = signal('');

  anunciar(texto: string): void {
    this.mensaje.set('');
    setTimeout(() => this.mensaje.set(texto), 60);
  }
}
