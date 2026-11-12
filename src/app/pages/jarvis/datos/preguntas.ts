import { IdPregunta, PasoEvaluacion, Pregunta } from '../modelos';

/** Los 5 pasos de la evaluación empresarial (el paso 6 es la revisión). */
export const PASOS: PasoEvaluacion[] = [
  {
    titulo: 'Tu empresa',
    porque: 'Con esto ajusto las recomendaciones a tu tamaño y sector.',
    preguntas: [
      { id: 'empresa', tipo: 'text', etiqueta: 'Nombre de la empresa', ayuda: 'Solo para el encabezado del informe.', obligatoria: true, placeholder: 'Ej.: Ferretería La Esquina' },
      { id: 'sector', tipo: 'select', etiqueta: 'Sector', obligatoria: true,
        opciones: ['Comercio', 'Educación', 'Salud', 'Servicios financieros', 'Tecnología', 'Gobierno', 'Manufactura', 'Turismo y hotelería', 'Otro'].map((s): [string, string] => [s, s]) },
      { id: 'empleados', tipo: 'radio', etiqueta: '¿Cuántas personas trabajan?', obligatoria: true,
        opciones: [['1-10', '1 a 10'], ['11-50', '11 a 50'], ['51-200', '51 a 200'], ['200+', 'Más de 200']] },
    ],
  },
  {
    titulo: 'Equipos y servicios',
    porque: 'Saber qué usan me ayuda a ver por dónde podría entrar un atacante.',
    preguntas: [
      { id: 'infra', tipo: 'radio', etiqueta: '¿Dónde están sus sistemas?', obligatoria: true,
        ayuda: '<b>En la nube</b> significa que otra empresa guarda tus programas y archivos en Internet (por ejemplo, Google o Microsoft).',
        opciones: [['nube', 'Casi todo en la nube'], ['mixta', 'Una mezcla de nube y equipos propios'], ['propia', 'Principalmente en servidores propios'], ['basica', 'Solo computadores de oficina']] },
      { id: 'servidores', tipo: 'radio', etiqueta: '¿Tienen servidores propios en la oficina?', obligatoria: true,
        ayuda: 'Un <b>servidor</b> es un computador que presta un servicio a los demás, como guardar archivos o el sistema contable.',
        opciones: [['si', 'Sí'], ['no', 'No'], ['nose', 'No lo sé']] },
      { id: 'nube', tipo: 'check', etiqueta: '¿Qué servicios en la nube usan?', ayuda: 'Marca todos los que apliquen.',
        opciones: [['m365', 'Microsoft 365 / Outlook'], ['google', 'Google Workspace / Gmail'], ['aws', 'Amazon Web Services'], ['azure', 'Microsoft Azure'], ['otra', 'Otro'], ['ninguna', 'Ninguno']] },
      { id: 'web', tipo: 'check', etiqueta: '¿Qué tienen publicado en Internet?', ayuda: 'Todo lo que se ve desde Internet puede ser buscado por atacantes.',
        opciones: [['sitio', 'Página web'], ['tienda', 'Tienda en línea o pagos'], ['app', 'Aplicación móvil'], ['interno', 'Un sistema interno al que se entra desde fuera (contabilidad, archivos, escritorio remoto)'], ['ninguno', 'Nada']] },
    ],
  },
  {
    titulo: 'Acceso y contraseñas',
    porque: 'La mayoría de los ataques empieza con una contraseña robada.',
    preguntas: [
      { id: 'auth', tipo: 'check', etiqueta: '¿Cómo entran las personas a los sistemas?',
        opciones: [['clave', 'Usuario y contraseña'], ['mfa', 'Verificación en dos pasos (un código además de la clave)'], ['sso', 'Un solo inicio de sesión para todo (SSO)'], ['compartida', 'Algunas cuentas se comparten entre varias personas']] },
      { id: 'mfa', tipo: 'radio', etiqueta: '¿Quiénes usan verificación en dos pasos?', obligatoria: true,
        ayuda: 'Es el <b>código extra</b> que llega al celular o a una aplicación después de escribir la contraseña.',
        opciones: [['todos', 'Todas las personas'], ['admins', 'Solo administradores o algunos cargos'], ['nadie', 'Nadie'], ['nose', 'No lo sé']] },
      { id: 'politica', tipo: 'radio', etiqueta: '¿Tienen reglas para las contraseñas?', obligatoria: true,
        opciones: [['ninguna', 'No hay reglas'], ['basica', 'Solo un largo mínimo'], ['completa', 'Largo mínimo, no repetir claves y un gestor de contraseñas']] },
    ],
  },
  {
    titulo: 'Protección y copias',
    porque: 'Si algo sale mal, estas defensas deciden si es un susto o una catástrofe.',
    preguntas: [
      { id: 'backup', tipo: 'radio', etiqueta: '¿Hacen copias de seguridad?', obligatoria: true,
        ayuda: 'Una <b>copia de seguridad</b> es un duplicado de la información para recuperarla si se daña o la secuestran.',
        opciones: [['no', 'No'], ['manual', 'A veces, a mano'], ['auto', 'Automáticas'], ['auto-off', 'Automáticas, con una copia desconectada y probada']] },
      { id: 'antivirus', tipo: 'radio', etiqueta: '¿Los equipos tienen antivirus?', obligatoria: true,
        opciones: [['ninguno', 'No'], ['algunos', 'Algunos equipos'], ['todos', 'Todos los equipos'], ['central', 'Todos, administrados desde una consola central (EDR)']] },
      { id: 'firewall', tipo: 'radio', etiqueta: '¿Hay un firewall que proteja la red?', obligatoria: true,
        ayuda: 'Un <b>firewall</b> es un filtro que decide qué puede entrar o salir de la red.',
        opciones: [['si', 'Sí'], ['no', 'No'], ['nose', 'No lo sé']] },
      { id: 'updates', tipo: 'radio', etiqueta: '¿Cómo se actualizan los equipos y programas?', obligatoria: true,
        opciones: [['auto', 'Automáticamente'], ['manual', 'A mano, cuando alguien se acuerda'], ['nunca', 'Casi nunca'], ['nose', 'No lo sé']] },
    ],
  },
  {
    titulo: 'Personas e incidentes',
    porque: 'La gente es la primera línea de defensa.',
    preguntas: [
      { id: 'capacitacion', tipo: 'radio', etiqueta: '¿Capacitan al equipo en ciberseguridad?', obligatoria: true,
        opciones: [['nunca', 'Nunca'], ['ingreso', 'Solo al entrar a la empresa'], ['anual', 'Al menos una vez al año'], ['periodica', 'Varias veces al año, con simulacros']] },
      { id: 'incidentes', tipo: 'check', etiqueta: '¿Han tenido alguno de estos problemas?', ayuda: 'Esto queda solo en tu informe.',
        opciones: [['phishing', 'Alguien cayó en un correo o mensaje falso'], ['ransomware', 'Secuestro de archivos (ransomware)'], ['cuenta', 'Robo de una cuenta'], ['fuga', 'Fuga o pérdida de datos'], ['ninguno', 'Ninguno'], ['nose', 'No lo sé']] },
      { id: 'plan', tipo: 'radio', etiqueta: '¿Saben qué hacer si ocurre un ataque?', obligatoria: true,
        ayuda: 'Un <b>plan de respuesta</b> dice quién hace qué, a quién se avisa y cómo se recupera.',
        opciones: [['si', 'Sí, está escrito'], ['informal', 'Más o menos, no está escrito'], ['no', 'No']] },
    ],
  },
];

/** Opciones que, al marcarse en una pregunta de casillas, desmarcan las demás. */
export const OPCIONES_EXCLUSIVAS = ['ninguna', 'ninguno', 'nose'];

const POR_ID = new Map<IdPregunta, Pregunta>(PASOS.flatMap((p) => p.preguntas).map((q) => [q.id, q]));

export function pregunta(id: IdPregunta): Pregunta | undefined {
  return POR_ID.get(id);
}

/** Texto visible de una opción ('mixta' → 'Una mezcla de nube y equipos propios'). */
export function textoOpcion(id: IdPregunta, valor: string): string {
  return pregunta(id)?.opciones?.find((o) => o[0] === valor)?.[1] ?? valor;
}
