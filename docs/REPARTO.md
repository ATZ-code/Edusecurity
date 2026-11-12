# EduSecurity · Reparto del trabajo para 3 participantes (diseño v2)

La guía completa, con el paso a paso de Git, está en el documento compartido **«Guía de trabajo · Frontend EduSecurity»**.
Aquí queda lo esencial para tenerlo junto al código.

- **Diseño de referencia:** `docs/diseno/index.html`. Ábrelo con doble clic; necesita Internet para las fuentes.
- **Las líneas que se citan abajo** son de ese archivo.
- **JARVIS:** su comportamiento está en `docs/diseno/jarvis.js` y `docs/diseno/jarvis.css`.

## Ramas

```
main                                versión estable (solo recibe develop al cerrar cada etapa)
└── develop                         integración del equipo
    └── feature/diseno-base         la base con el diseño v2 (se une a develop primero)
        ├── feature/p1-acceso-portada
        ├── feature/p2-contenido-educativo
        └── feature/p3-jarvis
```

## Ya está hecho en la base

- **Estilos:** sistema de diseño completo en `src/styles/edusecurity.css` y `jarvis.css`, con tema claro y alto contraste.
- **Marco de la página:** menú, pie de página, panel de accesibilidad, avisos, botón de JARVIS y «Volver arriba».
- **Sesión:** usuarios de prueba, JWT, guardias por rol, bloqueo por intentos y código en dos pasos (`core/auth`).
- **Mascota:** Prisma con sus 7 estados (`shared/prisma`).
- **Aparición al desplazarse:** directiva `Revelar` (`shared/revelar`); se usa con `class="rv" appRevelar`.
- **JARVIS por dentro:** motor de evaluación, PDF del informe, validación del escaneo y servicios (`pages/jarvis`).
- **Ejemplo de sección terminada:** la cinta de amenazas (`pages/inicio/secciones/ticker`).

## Participante 1 · Acceso, portada y páginas del estudiante — rama `feature/p1-acceso-portada`

| Tarea | Carpeta | HTML muestra | JS muestra |
|---|---|---|---|
| Héroe: título que sube palabra por palabra, «conocimiento» que se descifra, triángulos de fondo, celular con la lupa | `pages/inicio/secciones/hero` | 765–840 | 1508–1522, 1485–1507, 1365–1375 |
| ¿Qué es EduSecurity?: texto + mapa de temas | `pages/inicio/secciones/que-es` | 850–892 | 1365–1375 |
| Inicio de sesión con el diseño del panel (contraseña con Mostrar/Ocultar, dos pasos, bienvenida) | `pages/ingresar` | 1175–1272 | 1787–1933 |
| Adaptar al diseño v2: aprendizaje gamificado, desafío de preguntas y soporte | `pages/aprendizaje-gamificado`, `pages/preguntas-desafio`, `pages/soporte-asistencia` | — | — |
| Decidir qué se reutiliza de la portada anterior y borrarla | `pages/pagina-inicio` | — | — |

**Revisión:** también revisa y une los pull requests de los otros dos.

## Participante 2 · Contenido educativo — rama `feature/p2-contenido-educativo`

| Tarea | Carpeta | HTML muestra | JS muestra |
|---|---|---|---|
| Amenazas: 5 pestañas verticales con su ejemplo, la señal y qué hacer | `pages/inicio/secciones/amenazas` | 895–1006 | 1376–1391, 1523–1527 |
| Servicios y herramientas: 3 capítulos, trazo con el scroll, barras y puntaje animados | `pages/inicio/secciones/herramientas` | 1009–1065 | 1528–1551, 1523–1527 |
| Accesibilidad e inclusión (el botón abre el panel) | `pages/inicio/secciones/accesibilidad` | 1090–1114 | — |
| Equipo: carrusel animado | `pages/inicio/secciones/equipo` | 1117–1142 | 1552–1694 |

## Participante 3 · JARVIS — rama `feature/p3-jarvis`

| Tarea | Carpeta | Referencia |
|---|---|---|
| Sección JARVIS del inicio (Prisma + capacidades) | `pages/inicio/secciones/asistente` | HTML 1068–1087 |
| Llamado final con el globo-escudo | `pages/inicio/secciones/final` | HTML 1146–1157, JS 1695–1786 |
| Pestaña Conversar | `pages/jarvis/conversar` | `docs/diseno/jarvis.js`, sección 3 |
| Pestaña Evaluar mi empresa (5 pasos + revisión) | `pages/jarvis/evaluacion` | sección 4 |
| Pestaña Informe (10 secciones + PDF) | `pages/jarvis/informe` | sección 5 |
| Pestaña Escaneo técnico (sin resultados inventados) | `pages/jarvis/escaneo` | sección 7 |

La lógica difícil de JARVIS ya está hecha y probada: `evaluar()`, `construirPdf()`, `validarObjetivo()`,
`JarvisEstadoService` y `JarvisIaService`. Cada pestaña trae en su `.ts` las instrucciones exactas.

## Archivos compartidos

Avisa en el grupo antes de tocar cualquiera de estos:
- `src/app/app.routes.ts`
- `src/app/core/**` y `src/app/layout/**`
- `src/styles/*.css`
- `angular.json` y `package.json`

## Usuarios de prueba (modo demo)

| Rol | Correo | Nota |
|---|---|---|
| Estudiante | `estudiante@edusecurity.co` | |
| Empresa | `empresa@edusecurity.co` | Entra al área empresarial de JARVIS |
| Administrador | `admin@edusecurity.co` | Pide el código `482913` |

La clave de todos es `Seguro2026!`.

## Receta para convertir una sección

1. Copia el HTML de la muestra (las líneas de tu tabla) al `.html` del componente y borra el recuadro `.pendiente`.
2. Cambia `href="#algo"` por `routerLink="/" fragment="algo"` e importa `RouterLink`.
3. Pasa los textos que se repiten a un arreglo en el `.ts` y píntalos con `@for`.
4. Cambia `addEventListener` por `(click)="metodo()"` y guarda el estado con `signal()`.
5. Lo que dibuja en un canvas o mide la página va en `afterNextRender(...)`. Si `AccesibilidadService.reducirMovimiento()` es verdadero, no animes.
6. Conserva `aria-*`, `role`, los textos `sr-only` y el orden de los títulos. Para avisos usa `AnunciadorService.anunciar()`.
7. En el texto de las plantillas, `@`, `{` y `}` se escriben `&#64;`, `&#123;` y `&#125;`.
8. Para que algo aparezca al desplazarse: `class="rv" appRevelar` (importa `Revelar`).

## Reglas del proyecto

- No inventar resultados: lo que no está conectado se muestra como «no conectado».
- Ninguna clave de IA o del escáner en el frontend; todo pasa por el API Gateway.
- Escaneos solo de activos propios o autorizados, verificados antes, sin explotación ni pruebas destructivas.
- No afirmar que se cumple WCAG 2.2 AA sin haber hecho las pruebas.
