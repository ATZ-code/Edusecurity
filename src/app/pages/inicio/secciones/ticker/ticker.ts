import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Amenaza {
  nombre: string;
  detalle: string;
}

/**
 * Cinta de amenazas (EJEMPLO YA TERMINADO: úsalo como modelo). Referencia: docs/diseno/index.html líneas 842–848.
 * - Los textos pasan a un arreglo y se pintan con @for.
 * - La segunda copia existe solo para que la animación sea continua: va con aria-hidden.
 * - La animación la da la clase .ticker-track del CSS global y se detiene sola con "Reducir animaciones".
 */
@Component({
  selector: 'app-ticker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ticker.html',
})
export class Ticker {
  protected readonly amenazas: Amenaza[] = [
    { nombre: 'Phishing', detalle: 'correos que suplantan a tu banco' },
    { nombre: 'Smishing', detalle: 'mensajes de paquetes “retenidos”' },
    { nombre: 'Vishing', detalle: 'llamadas de falsos asesores' },
    { nombre: 'Contraseñas', detalle: 'reutilizadas y filtradas' },
    { nombre: 'Enlaces acortados', detalle: 'que esconden su destino' },
    { nombre: 'Ingeniería social', detalle: 'urgencia, miedo y premios' },
  ];
}
