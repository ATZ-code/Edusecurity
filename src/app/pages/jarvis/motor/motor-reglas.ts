import { textoOpcion } from '../datos/preguntas';
import { Hallazgo, IdPregunta, Informe, Respuestas, SEVERIDADES, Severidad } from '../modelos';

/**
 * Motor de reglas de la evaluación empresarial.
 * Determinista y explicable: cada hallazgo dice de qué respuesta sale (evidencia).
 * Produce POSIBLES RIESGOS según respuestas, nunca vulnerabilidades confirmadas.
 * Funciones puras (sin Angular): se pueden probar con pruebas unitarias.
 */

const PESO: Record<Severidad, number> = { Crítico: 22, Alto: 12, Medio: 6, Bajo: 3, Informativo: 0 };

function uno(a: Respuestas, id: IdPregunta): string {
  const v = a[id];
  return typeof v === 'string' ? v : '';
}
function lista(a: Respuestas, id: IdPregunta): string[] {
  const v = a[id];
  return Array.isArray(v) ? v : [];
}

type NuevoHallazgo = Omit<Hallazgo, 'prioridad'>;

export function evaluar(a: Respuestas): Informe {
  const F: NuevoHallazgo[] = [];
  const add = (h: NuevoHallazgo) => F.push(h);
  const txt = (id: IdPregunta) => textoOpcion(id, uno(a, id));

  const nube = lista(a, 'nube');
  const web = lista(a, 'web');
  const auth = lista(a, 'auth');
  const incidentes = lista(a, 'incidentes');
  const correoNube = nube.some((x) => x === 'm365' || x === 'google');
  const expuesto = web.includes('interno');
  const malos = incidentes.filter((x) => ['phishing', 'ransomware', 'cuenta', 'fuga'].includes(x));
  const mfa = uno(a, 'mfa');

  if (mfa === 'nadie' || mfa === 'nose' || mfa === 'admins') {
    add({
      id: 'mfa',
      severidad: mfa === 'nadie' ? (correoNube || expuesto ? 'Crítico' : 'Alto') : 'Medio',
      tipo: 'riesgo',
      titulo: mfa === 'admins' ? 'La verificación en dos pasos no protege a todo el equipo' : 'Las cuentas dependen solo de la contraseña',
      descripcion: 'Si alguien roba o adivina una contraseña, puede entrar sin que nada lo detenga. Es la forma más común de robo de cuentas de correo.',
      consecuencias: 'Robo del correo empresarial, fraudes a clientes y proveedores en nombre de la empresa, acceso a documentos.',
      recomendacion: 'Activa la verificación en dos pasos para todas las cuentas, empezando por correo, administradores y banca. Prefiere aplicaciones de autenticación o llaves físicas antes que SMS.',
      detalleTecnico: 'Habilitar MFA obligatorio (Conditional Access en Microsoft 365 / 2SV forzada en Google Workspace). Bloquear autenticación heredada (IMAP/POP/SMTP básico).',
      evidencia: `Respuesta: “${txt('mfa')}”${correoNube ? ' y correo en la nube.' : '.'}`,
    });
  }
  if (auth.includes('compartida')) {
    add({
      id: 'shared', severidad: 'Alto', tipo: 'riesgo',
      titulo: 'Se comparten cuentas entre varias personas',
      descripcion: 'Cuando varias personas usan la misma cuenta, no se sabe quién hizo qué y la contraseña termina circulando por chats y papeles.',
      consecuencias: 'Imposible rastrear un incidente; exempleados que conservan el acceso.',
      recomendacion: 'Crea una cuenta personal para cada persona. Si una cuenta debe compartirse, guárdala en un gestor de contraseñas con acceso controlado.',
      detalleTecnico: 'Cuentas nominativas, RBAC y bóveda de secretos con registro de accesos. Rotar credenciales compartidas al salir alguien del equipo.',
      evidencia: 'Marcaste “Algunas cuentas se comparten entre varias personas”.',
    });
  }
  const politica = uno(a, 'politica');
  if (politica === 'ninguna' || politica === 'basica') {
    add({
      id: 'pwd', severidad: politica === 'ninguna' ? 'Alto' : 'Medio', tipo: 'riesgo',
      titulo: politica === 'ninguna' ? 'No hay reglas para las contraseñas' : 'Las reglas de contraseñas son mínimas',
      descripcion: 'Las contraseñas cortas o repetidas en varios sitios se adivinan o se filtran fácilmente.',
      consecuencias: 'Si una clave se filtra en otro sitio, sirve para entrar a los sistemas de la empresa.',
      recomendacion: 'Pide frases largas (14 caracteres o más), prohíbe repetirlas entre servicios y entrega un gestor de contraseñas al equipo.',
      detalleTecnico: 'Política alineada con NIST SP 800-63B: longitud mínima, listas de contraseñas comprometidas, sin caducidad forzada sin motivo.',
      evidencia: `Respuesta: “${txt('politica')}”.`,
    });
  }
  const backup = uno(a, 'backup');
  if (backup !== 'auto-off') {
    let sev: Severidad = backup === 'no' ? 'Crítico' : backup === 'manual' ? 'Alto' : 'Medio';
    if (malos.includes('ransomware')) sev = 'Crítico';
    add({
      id: 'backup', severidad: sev, tipo: 'riesgo',
      titulo: backup === 'no' ? 'No hay copias de seguridad' : backup === 'manual' ? 'Las copias de seguridad dependen de que alguien se acuerde' : 'Las copias no tienen una versión desconectada',
      descripcion: 'Sin una copia reciente y separada, un daño, un robo o un secuestro de archivos puede borrar años de trabajo.',
      consecuencias: 'Pérdida permanente de información o pago de un rescate sin garantía de recuperarla.',
      recomendacion: 'Sigue la regla 3-2-1: tres copias, en dos lugares distintos, una fuera de la oficina y desconectada. Prueba restaurar una vez al mes.',
      detalleTecnico: 'Copias inmutables o fuera de línea, cifradas, con pruebas de restauración documentadas (RPO/RTO definidos).',
      evidencia: `Respuesta: “${txt('backup')}”${malos.includes('ransomware') ? ' y un antecedente de ransomware.' : '.'}`,
    });
  }
  const antivirus = uno(a, 'antivirus');
  if (antivirus === 'ninguno' || antivirus === 'algunos') {
    add({
      id: 'av', severidad: antivirus === 'ninguno' ? 'Alto' : 'Medio', tipo: 'riesgo',
      titulo: antivirus === 'ninguno' ? 'Los equipos no tienen antivirus' : 'Solo algunos equipos tienen antivirus',
      descripcion: 'Un solo equipo sin protección puede ser la puerta de entrada para todo lo demás.',
      consecuencias: 'Infección que se extiende por la red; robo de contraseñas guardadas en el navegador.',
      recomendacion: 'Instala protección en todos los equipos y revisa que esté activa y actualizada.',
      detalleTecnico: 'Desplegar EDR con gestión centralizada y alertas; cubrir servidores y portátiles.',
      evidencia: `Respuesta: “${txt('antivirus')}”.`,
    });
  }
  const firewall = uno(a, 'firewall');
  if (firewall !== 'si') {
    add({
      id: 'fw', severidad: firewall === 'no' ? 'Alto' : 'Medio', tipo: firewall === 'no' ? 'riesgo' : 'preventivo',
      titulo: firewall === 'no' ? 'La red no tiene firewall' : 'No se sabe si hay un firewall',
      descripcion: 'Sin un filtro, cualquier servicio de la red puede quedar visible desde Internet.',
      consecuencias: 'Servicios internos expuestos a intentos de acceso automáticos.',
      recomendacion: 'Confirma con tu proveedor de Internet o de sistemas que el router tenga firewall activo y que solo esté abierto lo necesario.',
      detalleTecnico: 'Política de denegar por defecto, revisión de reglas NAT/port-forwarding y registro de conexiones.',
      evidencia: `Respuesta: “${txt('firewall')}”.`,
    });
  }
  const updates = uno(a, 'updates');
  if (updates !== 'auto') {
    add({
      id: 'upd', severidad: updates === 'manual' ? 'Medio' : 'Alto', tipo: 'riesgo',
      titulo: 'Los equipos y programas no se actualizan a tiempo',
      descripcion: 'Las actualizaciones cierran fallas que los atacantes ya conocen y aprovechan.',
      consecuencias: 'Infecciones a través de fallas públicas que tienen arreglo disponible.',
      recomendacion: 'Activa las actualizaciones automáticas en equipos, navegadores y programas, y revisa una vez al mes que estén al día.',
      detalleTecnico: 'Gestión de parches con inventario de software y SLA por criticidad (CVSS ≥ 9: menos de 7 días).',
      evidencia: `Respuesta: “${txt('updates')}”.`,
    });
  }
  const capacitacion = uno(a, 'capacitacion');
  if (capacitacion !== 'periodica') {
    add({
      id: 'train', severidad: capacitacion === 'nunca' ? 'Alto' : capacitacion === 'ingreso' ? 'Medio' : 'Bajo', tipo: 'riesgo',
      titulo: capacitacion === 'nunca' ? 'El equipo no ha recibido capacitación en seguridad' : 'La capacitación en seguridad es poco frecuente',
      descripcion: 'La mayoría de los ataques empieza con un correo o una llamada falsa que alguien no reconoció.',
      consecuencias: 'Clics en enlaces falsos, contraseñas entregadas, transferencias fraudulentas.',
      recomendacion: 'Programa capacitaciones cortas varias veces al año con simulacros de phishing. Los módulos de EduSecurity sirven para esto.',
      detalleTecnico: 'Programa de concienciación con métricas (tasa de clic en simulacros, reportes de phishing).',
      evidencia: `Respuesta: “${txt('capacitacion')}”.`,
    });
  }
  if (expuesto) {
    add({
      id: 'exposed', severidad: uno(a, 'servidores') === 'si' ? 'Alto' : 'Medio', tipo: 'riesgo',
      titulo: 'Hay sistemas internos accesibles desde Internet',
      descripcion: 'Un sistema pensado para la oficina que se abre a Internet queda al alcance de ataques automáticos todo el día.',
      consecuencias: 'Acceso no autorizado a contabilidad, archivos o escritorios remotos.',
      recomendacion: 'Pon esos sistemas detrás de una VPN o de un acceso con verificación en dos pasos, y cierra lo que no se use.',
      detalleTecnico: 'No exponer RDP/SMB/paneles de administración; usar VPN o ZTNA con MFA. Este punto debe confirmarse con un escaneo autorizado.',
      evidencia: 'Marcaste “Un sistema interno al que se entra desde fuera”.',
    });
  }
  const plan = uno(a, 'plan');
  if (malos.length) {
    add({
      id: 'inc', severidad: plan === 'si' ? 'Medio' : 'Alto', tipo: 'riesgo',
      titulo: 'Hubo incidentes de seguridad antes',
      descripcion: 'Un incidente pasado muestra que la empresa ya está en la mira y que alguna defensa falló.',
      consecuencias: 'Repetición del ataque por la misma vía si no se corrigió la causa.',
      recomendacion: 'Revisa qué permitió cada incidente y confirma que esa causa ya está corregida.',
      detalleTecnico: 'Análisis de causa raíz y lecciones aprendidas documentadas por incidente.',
      evidencia: `Antecedentes: ${malos.map((x) => textoOpcion('incidentes', x)).join('; ')}.`,
    });
  }
  if (plan !== 'si') {
    add({
      id: 'plan', severidad: 'Medio', tipo: 'preventivo',
      titulo: 'No hay un plan escrito para responder a un ataque',
      descripcion: 'Durante un ataque se pierde tiempo valioso decidiendo quién hace qué.',
      consecuencias: 'Más daño, más tiempo sin operar y avisos tardíos a clientes o autoridades.',
      recomendacion: 'Escribe una página con: a quién llamar, cómo aislar un equipo, dónde están las copias y cómo avisar a clientes.',
      detalleTecnico: 'Plan de respuesta a incidentes con roles, contactos y runbooks (NIST SP 800-61).',
      evidencia: `Respuesta: “${txt('plan')}”.`,
    });
  }
  if (web.includes('tienda')) {
    add({
      id: 'pay', severidad: 'Medio', tipo: 'preventivo',
      titulo: 'Manejan pagos o datos de clientes en línea',
      descripcion: 'Las tiendas en línea son un objetivo atractivo porque manejan datos de tarjetas y personales.',
      consecuencias: 'Robo de datos de clientes y problemas legales.',
      recomendacion: 'Usa una pasarela de pagos certificada en lugar de guardar tarjetas, y revisa el sitio con un escaneo autorizado.',
      detalleTecnico: 'Cumplimiento PCI DSS mediante pasarela; cabeceras de seguridad, TLS vigente y WAF.',
      evidencia: 'Marcaste “Tienda en línea o pagos”.',
    });
  }
  if (web.some((x) => x === 'sitio' || x === 'tienda' || x === 'app')) {
    add({
      id: 'scan', severidad: 'Informativo', tipo: 'preventivo',
      titulo: 'Tus servicios públicos aún no tienen una revisión técnica',
      descripcion: 'Este informe se basa en tus respuestas. Para confirmar fallas reales en tu página o aplicación hace falta un escaneo técnico autorizado.',
      consecuencias: 'Pueden existir problemas que solo un escaneo detecta (certificados, configuración, versiones).',
      recomendacion: 'Cuando el servicio de escaneo esté disponible, registra tu dominio en “Escaneo técnico” y verifica que es tuyo.',
      detalleTecnico: 'Revisión de TLS, cabeceras HTTP, servicios expuestos y versiones con herramientas no intrusivas.',
      evidencia: 'Tienes servicios publicados en Internet.',
    });
  }
  const sector = uno(a, 'sector');
  if (['Salud', 'Servicios financieros', 'Educación', 'Gobierno'].includes(sector)) {
    add({
      id: 'law', severidad: 'Informativo', tipo: 'preventivo',
      titulo: 'Tu sector maneja datos personales sensibles',
      descripcion: 'En Colombia, la Ley 1581 de 2012 obliga a proteger los datos personales que la empresa recoge.',
      consecuencias: 'Sanciones y pérdida de confianza si se filtran datos.',
      recomendacion: 'Revisa tu política de tratamiento de datos y quién puede ver la información sensible.',
      detalleTecnico: 'Clasificación de datos, control de acceso por mínimo privilegio y registro de accesos.',
      evidencia: `Sector: ${sector}.`,
    });
  }
  const empleados = uno(a, 'empleados');
  if ((empleados === '51-200' || empleados === '200+') && !auth.includes('sso')) {
    add({
      id: 'sso', severidad: 'Bajo', tipo: 'preventivo',
      titulo: 'Las cuentas no están centralizadas',
      descripcion: 'Con muchas personas, administrar cuentas por separado hace fácil olvidar quitar accesos.',
      consecuencias: 'Cuentas activas de personas que ya no trabajan en la empresa.',
      recomendacion: 'Centraliza el acceso con un inicio de sesión único y un proceso para dar y quitar permisos.',
      detalleTecnico: 'IdP con SSO (SAML/OIDC) y aprovisionamiento automático (SCIM).',
      evidencia: `Tamaño: ${txt('empleados')}, sin SSO.`,
    });
  }

  F.sort((x, y) => SEVERIDADES.indexOf(x.severidad) - SEVERIDADES.indexOf(y.severidad));
  const hallazgos: Hallazgo[] = F.map((h, i) => ({ ...h, prioridad: i + 1 }));
  const puntuacion = Math.max(5, 100 - hallazgos.reduce((s, h) => s + PESO[h.severidad], 0));
  const nivel = puntuacion >= 80 ? 'Buena base de seguridad'
    : puntuacion >= 60 ? 'Aceptable, con mejoras pendientes'
    : puntuacion >= 40 ? 'Riesgo considerable'
    : 'Riesgo alto';

  const activos: [string, string][] = [['Infraestructura', txt('infra')]];
  if (uno(a, 'servidores') === 'si') activos.push(['Servidores', 'Servidores propios en la oficina']);
  nube.filter((x) => x !== 'ninguna').forEach((x) => activos.push(['Nube', textoOpcion('nube', x)]));
  web.filter((x) => x !== 'ninguno').forEach((x) => activos.push(['En Internet', textoOpcion('web', x)]));

  const conteo = Object.fromEntries(SEVERIDADES.map((s) => [s, hallazgos.filter((h) => h.severidad === s).length])) as Record<Severidad, number>;
  const empresa = uno(a, 'empresa') || 'la empresa';
  const urgentes = hallazgos.filter((h) => h.severidad === 'Crítico' || h.severidad === 'Alto').slice(0, 3).map((h) => h.titulo.toLowerCase());
  const conclusiones = [
    `Según tus respuestas, ${empresa} tiene un nivel de seguridad “${nivel.toLowerCase()}” (${puntuacion} de 100).`,
    urgentes.length
      ? `Lo más urgente: ${urgentes.join('; ')}.`
      : 'No aparecen riesgos críticos ni altos en tus respuestas. Mantén las buenas prácticas y revísalas cada seis meses.',
    'Este informe no confirma vulnerabilidades técnicas: se basa solo en lo que respondiste. Para confirmarlas hace falta un escaneo autorizado de tus servicios.',
  ];

  return {
    version: 1,
    fecha: new Date().toISOString(),
    empresa,
    sector,
    empleados: txt('empleados'),
    puntuacion,
    nivel,
    conteo,
    activos,
    hallazgos,
    conclusiones,
    respuestas: structuredClone(a),
    resumenIA: null,
  };
}

/** Estado de la mascota según el informe. */
export function estadoSegunInforme(i: Informe | null): 'welcome' | 'alert' | 'ok' | 'idle' {
  if (!i) return 'welcome';
  if (i.conteo['Crítico']) return 'alert';
  return i.puntuacion >= 80 ? 'ok' : 'idle';
}
