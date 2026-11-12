import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Héroe: “Tu seguridad digital comienza con el conocimiento”
 * Responsable: Participante 1  ·  ver docs/REPARTO.md
 * Referencia: docs/diseno/index.html, HTML líneas 765–840; JS: palabras que suben + descifrado 1508–1522, triángulos 1485–1507, desplazamiento del arte 1365–1375.
 * Para la aparición al desplazarse usa la directiva Revelar (shared/revelar): class="rv" appRevelar.
 */
@Component({
  selector: 'app-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {}
