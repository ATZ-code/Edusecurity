export type Rol = 'ESTUDIANTE' | 'EMPRESA' | 'ADMINISTRADOR';

export interface Usuario {
  nombre: string;
  correo: string;
  rol: Rol;
}

export interface Sesion {
  usuario: Usuario;
  /** JWT emitido por el auth-service. En modo demo es un texto de prueba sin validez. */
  token: string;
}

export type ResultadoLogin =
  | { estado: 'ok'; sesion: Sesion }
  | { estado: 'requiere-codigo'; desafio: string; correo: string }
  | { estado: 'credenciales-invalidas'; intentosRestantes: number }
  | { estado: 'bloqueado'; segundos: number }
  | { estado: 'error-red' };

export type ResultadoCodigo =
  | { estado: 'ok'; sesion: Sesion }
  | { estado: 'codigo-invalido' }
  | { estado: 'error-red' };

export const NOMBRE_ROL: Record<Rol, string> = {
  ESTUDIANTE: 'Estudiante',
  EMPRESA: 'Empresa',
  ADMINISTRADOR: 'Administrador',
};
