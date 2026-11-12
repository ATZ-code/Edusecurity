import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Aprende sobre ciberseguridad: 5 amenazas con ejemplo
 * Responsable: Participante 2  ·  ver docs/REPARTO.md
 * Referencia: docs/diseno/index.html, HTML líneas 895–1006; JS: pestañas verticales 1376–1391, luz del cursor 1523–1527.
 * Para la aparición al desplazarse usa la directiva Revelar (shared/revelar): class="rv" appRevelar.
 */
@Component({
  selector: 'app-amenazas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './amenazas.html',
  styleUrl: './amenazas.scss',
})
export class Amenazas {}
