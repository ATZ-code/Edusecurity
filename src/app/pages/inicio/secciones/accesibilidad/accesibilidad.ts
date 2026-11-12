import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Accesibilidad e inclusión
 * Responsable: Participante 2  ·  ver docs/REPARTO.md
 * Referencia: docs/diseno/index.html, HTML líneas 1090–1114; JS: el botón abre el panel: AccesibilidadService.panelAbierto.set(true).
 * Para la aparición al desplazarse usa la directiva Revelar (shared/revelar): class="rv" appRevelar.
 */
@Component({
  selector: 'app-accesibilidad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accesibilidad.html',
  styleUrl: './accesibilidad.scss',
})
export class Accesibilidad {}
