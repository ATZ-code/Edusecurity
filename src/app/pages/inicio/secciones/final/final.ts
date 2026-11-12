import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Llamado final con el globo-escudo
 * Responsable: Participante 3  ·  ver docs/REPARTO.md
 * Referencia: docs/diseno/index.html, HTML líneas 1146–1157; JS: globo en canvas 1695–1786.
 * Para la aparición al desplazarse usa la directiva Revelar (shared/revelar): class="rv" appRevelar.
 */
@Component({
  selector: 'app-final',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './final.html',
  styleUrl: './final.scss',
})
export class Final {}
