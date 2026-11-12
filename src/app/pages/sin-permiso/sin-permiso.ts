import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NOMBRE_ROL } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-sin-permiso',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="wrap sec" style="text-align:center;display:grid;gap:1rem;justify-items:center">
      <h1 class="h2">Esta parte es solo para empresas</h1>
      <p class="soft" style="max-width:36rem">
        Entraste como <b>{{ rol() }}</b>. La evaluación empresarial y el escaneo técnico son del área empresarial.
        Puedes seguir aprendiendo o conversar con JARVIS.
      </p>
      <div class="hero-actions" style="justify-content:center">
        <a routerLink="/jarvis" class="btn btn-primary">Conversar con JARVIS</a>
        <a routerLink="/" class="btn btn-ghost">Volver al inicio</a>
      </div>
    </section>
  `,
})
export class SinPermiso {
  private auth = inject(AuthService);
  protected rol() {
    const r = this.auth.rol();
    return r ? NOMBRE_ROL[r] : 'invitado';
  }
}
