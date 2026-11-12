/** Tipos compartidos de JARVIS. */

export type Severidad = 'Crítico' | 'Alto' | 'Medio' | 'Bajo' | 'Informativo';
export const SEVERIDADES: readonly Severidad[] = ['Crítico', 'Alto', 'Medio', 'Bajo', 'Informativo'];

/** Cómo debe explicar JARVIS: a cualquier persona, a un técnico o a la gerencia. */
export type NivelExplicacion = 'sencillo' | 'tecnico' | 'empresa';

export type IdPregunta =
  | 'empresa' | 'sector' | 'empleados'
  | 'infra' | 'servidores' | 'nube' | 'web'
  | 'auth' | 'mfa' | 'politica'
  | 'backup' | 'antivirus' | 'firewall' | 'updates'
  | 'capacitacion' | 'incidentes' | 'plan';

export type Respuestas = Partial<Record<IdPregunta, string | string[]>>;

export type TipoPregunta = 'text' | 'select' | 'radio' | 'check';

export interface Pregunta {
  id: IdPregunta;
  tipo: TipoPregunta;
  etiqueta: string;
  /** Puede contener <b>…</b> para resaltar el término que se explica. */
  ayuda?: string;
  obligatoria?: boolean;
  placeholder?: string;
  /** [valor, texto]. En 'select' valor y texto son iguales. */
  opciones?: [string, string][];
}

export interface PasoEvaluacion {
  titulo: string;
  porque: string;
  preguntas: Pregunta[];
}

/**
 * 'riesgo'     = posible riesgo deducido de las respuestas (NO es una vulnerabilidad confirmada)
 * 'preventivo' = recomendación preventiva
 * 'confirmado' = vulnerabilidad técnica confirmada por un escaneo autorizado (solo vendrá del backend)
 */
export type TipoHallazgo = 'riesgo' | 'preventivo' | 'confirmado';

export interface Hallazgo {
  id: string;
  severidad: Severidad;
  tipo: TipoHallazgo;
  titulo: string;
  descripcion: string;
  consecuencias: string;
  recomendacion: string;
  detalleTecnico: string;
  evidencia: string;
  prioridad: number;
  /** Solo para hallazgos confirmados por escaneo. */
  cve?: string;
  cvss?: number;
}

export interface Informe {
  version: 1;
  fecha: string;
  empresa: string;
  sector: string;
  empleados: string;
  puntuacion: number;
  nivel: string;
  conteo: Record<Severidad, number>;
  activos: [string, string][];
  hallazgos: Hallazgo[];
  conclusiones: string[];
  respuestas: Respuestas;
  resumenIA: string | null;
}

export interface Actividad {
  fecha: string;
  mensaje: string;
}

export interface ActivoRegistrado {
  objetivo: string;
  tipo: 'dominio' | 'ip';
  token: string;
  horario: string;
  fecha: string;
  estado: 'pendiente_verificacion' | 'verificado';
}

export interface MensajeChat {
  rol: 'user' | 'assistant';
  texto: string;
}
