import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Servicios y herramientas: módulos, simulaciones, evaluaciones
 * Responsable: Participante 2  ·  ver docs/REPARTO.md
 * Referencia: docs/diseno/index.html, HTML líneas 1009–1065; JS: pantallas que se “usan” 1528–1541, trazo 1542–1551, luz del cursor 1523–1527.
 * Para la aparición al desplazarse usa la directiva Revelar (shared/revelar): class="rv" appRevelar.
 */
@Component({
  selector: 'app-herramientas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './herramientas.html',
  styleUrl: './herramientas.scss',
})
export class Herramientas {}
