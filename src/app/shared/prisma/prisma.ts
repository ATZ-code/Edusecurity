import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EstadoPrisma, prismaIconoSvg, prismaSvg } from './prisma-svg';

/**
 * Mascota de JARVIS.
 *   <app-prisma estado="analyzing" />            ilustración completa (con texto alternativo)
 *   <app-prisma estado="alert" [icono]="true" />  icono pequeño decorativo
 * El tamaño lo da el contenedor (el SVG ocupa el 100 % del ancho del componente).
 */
@Component({
  selector: 'app-prisma',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[innerHTML]': 'svg()',
    style: 'display:block;line-height:0',
  },
})
export class Prisma {
  private sanitizer = inject(DomSanitizer);
  readonly estado = input<EstadoPrisma>('idle');
  readonly icono = input(false);
  readonly etiqueta = input<string>();

  /** El SVG se genera aquí mismo a partir de valores fijos, nunca de texto del usuario: es seguro. */
  protected readonly svg = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      this.icono() ? prismaIconoSvg(this.estado()) : prismaSvg(this.estado(), this.etiqueta()),
    ),
  );
}
