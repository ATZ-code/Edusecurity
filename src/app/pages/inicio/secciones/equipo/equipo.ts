import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Equipo (carrusel animado)
 * Responsable: Participante 2  ·  ver docs/REPARTO.md
 * Referencia: docs/diseno/index.html, HTML líneas 1117–1142; JS: carrusel 1552–1694.
 * Para la aparición al desplazarse usa la directiva Revelar (shared/revelar): class="rv" appRevelar.
 */
@Component({
  selector: 'app-equipo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './equipo.html',
  styleUrl: './equipo.scss',
})
export class Equipo {}
