/**
 * Configuración de conexión con el backend (API Gateway de Spring Boot).
 *
 * - `demo: true`  → el frontend funciona sin backend (usuarios de prueba, IA no conectada).
 * - `demo: false` → todas las llamadas van al API Gateway. Las claves (IA, escáner) viven
 *                   SOLO en el backend; aquí nunca se escribe una clave.
 *
 * Para desarrollo local con el backend, crea `proxy.conf.json` apuntando al gateway
 * (ver docs/REPARTO.md) y deja `base` vacío.
 */
export const API = {
  demo: true,
  base: '',
  auth: {
    login: '/api/auth/login',
    verificarCodigo: '/api/auth/2fa/verificar',
    cerrarSesion: '/api/auth/logout',
  },
  ia: {
    chatJarvis: '/api/ia/jarvis/chat',
    resumenInforme: '/api/ia/jarvis/resumen',
  },
  seguridad: {
    evaluaciones: '/api/seguridad/evaluaciones',
    activos: '/api/seguridad/activos',
    verificarActivo: (id: string) => `/api/seguridad/activos/${encodeURIComponent(id)}/verificacion`,
    escaneos: '/api/seguridad/escaneos',
  },
} as const;

/** HU10: bloqueo temporal tras intentos fallidos (el backend también debe aplicarlo). */
export const POLITICA_ACCESO = {
  maxIntentos: 5,
  bloqueoSegundos: 30,
} as const;

/** El motor de escaneo del seguridad-service todavía no está conectado. */
export const ESCANEO_CONECTADO = false;

export function url(ruta: string): string {
  return API.base + ruta;
}
