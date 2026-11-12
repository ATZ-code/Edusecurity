import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Accesibilidad } from './secciones/accesibilidad/accesibilidad';
import { Amenazas } from './secciones/amenazas/amenazas';
import { Asistente } from './secciones/asistente/asistente';
import { Equipo } from './secciones/equipo/equipo';
import { Final } from './secciones/final/final';
import { Herramientas } from './secciones/herramientas/herramientas';
import { Hero } from './secciones/hero/hero';
import { QueEs } from './secciones/que-es/que-es';
import { Ticker } from './secciones/ticker/ticker';

/** Página de inicio (diseño v2): las secciones en el mismo orden que la muestra. */
@Component({
  selector: 'app-inicio',
  imports: [Hero, Ticker, QueEs, Amenazas, Herramientas, Asistente, Accesibilidad, Equipo, Final],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero />
    <app-ticker />
    <app-que-es />
    <app-amenazas />
    <app-herramientas />
    <app-asistente />
    <app-accesibilidad />
    <app-equipo />
    <app-final />
  `,
})
export class Inicio {}
