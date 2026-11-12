/**
 * Validaciones del registro de activos para escaneo (lado cliente).
 * El backend (seguridad-service) DEBE repetir todas estas validaciones: el frontend solo guía.
 */
export type TipoObjetivo = 'dominio' | 'ip';

const RE_DOMINIO = /^(?=.{1,253}$)([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,63}$/;
const RE_IP = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

/** Quita protocolo y ruta: "https://miempresa.com/x" → "miempresa.com". */
export function normalizarObjetivo(texto: string): string {
  return texto.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

export function esIpPrivada(ip: string): boolean {
  const [a = 0, b = 0] = ip.split('.').map(Number);
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 169 && b === 254) || a === 0 || a >= 224;
}

/** Devuelve el mensaje de error, o '' si el objetivo es válido. Un solo activo: sin rangos ni comodines. */
export function validarObjetivo(tipo: TipoObjetivo, original: string): string {
  const t = normalizarObjetivo(original);
  if (!t) return 'Escribe el dominio o la dirección IP.';
  if (/[*,\s]|\/\d+$/.test(original.trim())) return 'Escribe un solo activo. No se aceptan rangos, listas ni comodines (*).';
  if (tipo === 'dominio' && !RE_DOMINIO.test(t)) return 'Ese dominio no parece válido. Ejemplo: miempresa.com';
  if (tipo === 'ip' && !RE_IP.test(t)) return 'Esa dirección IP no parece válida. Ejemplo: 203.0.113.10';
  if (tipo === 'ip' && esIpPrivada(t)) return 'Es una dirección privada o reservada: no se puede revisar desde Internet.';
  return '';
}

/**
 * Código para demostrar propiedad (registro DNS TXT o archivo .well-known).
 * Provisional: cuando exista el backend, el código lo debe generar y guardar el seguridad-service.
 */
export function generarCodigoVerificacion(): string {
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  return 'edusecurity-verificacion=' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

/** Revisiones previstas del escaneo (todas no intrusivas). */
export const REVISIONES_ESCANEO: [string, string][] = [
  ['Información pública del dominio', 'Registros DNS, correo (SPF, DKIM, DMARC) y datos de registro.'],
  ['Certificado SSL/TLS', 'Vigencia, emisor, versiones de protocolo y cifrados.'],
  ['Configuración de seguridad web', 'Cabeceras HTTP (HSTS, CSP, X-Frame-Options) y redirección a HTTPS.'],
  ['Servicios y puertos expuestos', 'Lista corta de puertos comunes, con velocidad limitada.'],
  ['Tecnologías y versiones visibles', 'Servidor web, CMS y librerías que se anuncian públicamente.'],
  ['Vulnerabilidades conocidas', 'Cruce de versiones con bases CVE y puntuación CVSS, solo como posibles hasta confirmarse.'],
];
