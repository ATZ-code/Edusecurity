import { Routes } from '@angular/router';
import { rolGuard, sesionGuard } from './core/auth/auth.guards';
import { LayoutPublico } from './layout/layout-publico/layout-publico';

/**
 * Rutas de EduSecurity.
 *  /                         Inicio (pública, diseño nuevo)
 *  /ingresar                 Inicio de sesión
 *  /aprendizaje-gamificado   Área del estudiante (requiere sesión)
 *  /preguntas-desafio        Desafío de preguntas (requiere sesión)
 *  /soporte-asistencia       Ayuda
 *  /jarvis/...               Asistente: "conversar" es abierto; evaluación, informe y escaneo son del área empresarial
 */
export const routes: Routes = [
  {
    path: '',
    component: LayoutPublico,
    children: [
      { path: '', title: 'EduSecurity · Aprende a protegerte en Internet', loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio) },
      { path: 'ingresar', title: 'Iniciar sesión · EduSecurity', loadComponent: () => import('./pages/ingresar/ingresar').then((m) => m.Ingresar) },
      { path: 'sin-permiso', title: 'Sin permiso · EduSecurity', loadComponent: () => import('./pages/sin-permiso/sin-permiso').then((m) => m.SinPermiso) },
      { path: 'soporte-asistencia', title: 'Soporte · EduSecurity', loadComponent: () => import('./pages/soporte-asistencia/soporte-asistencia').then((m) => m.AsistenciaSoporteComponent) },
      { path: 'aprendizaje-gamificado', title: 'Mi aprendizaje · EduSecurity', canActivate: [sesionGuard], loadComponent: () => import('./pages/aprendizaje-gamificado/aprendizaje-gamificado').then((m) => m.AprendizajeGamificadoComponent) },
      { path: 'preguntas-desafio', title: 'Desafío · EduSecurity', canActivate: [sesionGuard], loadComponent: () => import('./pages/preguntas-desafio/preguntas-desafios').then((m) => m.PreguntasDesafiosComponent) },
    ],
  },
  {
    path: 'jarvis',
    title: 'JARVIS · EduSecurity',
    loadComponent: () => import('./pages/jarvis/jarvis').then((m) => m.Jarvis),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'conversar' },
      { path: 'conversar', title: 'Conversar · JARVIS', loadComponent: () => import('./pages/jarvis/conversar/conversar').then((m) => m.Conversar) },
      { path: 'evaluacion', title: 'Evaluar mi empresa · JARVIS', canActivate: [rolGuard('EMPRESA', 'ADMINISTRADOR')], loadComponent: () => import('./pages/jarvis/evaluacion/evaluacion').then((m) => m.Evaluacion) },
      { path: 'informe', title: 'Informe · JARVIS', canActivate: [rolGuard('EMPRESA', 'ADMINISTRADOR')], loadComponent: () => import('./pages/jarvis/informe/informe').then((m) => m.InformeJarvis) },
      { path: 'escaneo', title: 'Escaneo técnico · JARVIS', canActivate: [rolGuard('EMPRESA', 'ADMINISTRADOR')], loadComponent: () => import('./pages/jarvis/escaneo/escaneo').then((m) => m.Escaneo) },
    ],
  },
  { path: '**', redirectTo: '' },
];
