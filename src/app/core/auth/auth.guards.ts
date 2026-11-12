import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from './auth.models';
import { AuthService } from './auth.service';

/** Exige sesión iniciada. Si no hay, lleva a /ingresar y luego vuelve a la ruta pedida. */
export const sesionGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.autenticado()) return true;
  return inject(Router).createUrlTree(['/ingresar'], { queryParams: { volver: state.url } });
};

/** Exige uno de los roles indicados (separa el área educativa de la empresarial). */
export function rolGuard(...roles: Rol[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.autenticado()) {
      return router.createUrlTree(['/ingresar'], { queryParams: { volver: state.url, area: 'empresa' } });
    }
    return auth.tieneRol(...roles) ? true : router.createUrlTree(['/sin-permiso']);
  };
}
