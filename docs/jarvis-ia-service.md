# JARVIS · Contrato con el backend (ia-service y seguridad-service)

El frontend **no** guarda claves ni decide el comportamiento de la IA. Todo pasa por el API Gateway con el JWT del usuario.

## ia-service

### `POST /api/ia/jarvis/chat`
Petición:
```json
{
  "mensajes": [{ "rol": "user", "texto": "¿Qué debería corregir primero?" }],
  "nivel": "sencillo | tecnico | empresa",
  "informe": { "empresa": "…", "puntuacion": 42, "hallazgos": [ … ] } | null
}
```
Respuesta: `{ "respuesta": "texto en markdown sencillo" }`
Errores: `401/403` sin permiso · `429` límite de uso · `422` solicitud rechazada (ofensiva) · otros = error de red.

### `POST /api/ia/jarvis/resumen`
Petición `{ "informe": { … } }` → `{ "respuesta": "resumen ejecutivo" }`.

### Reglas que el ia-service debe poner como *system prompt* (no el navegador)
1. Eres JARVIS, asistente de ciberseguridad de EduSecurity. Profesional, amable, preciso y fácil de entender. Responde en español.
2. Nivel `sencillo`: palabras cotidianas y un ejemplo diario; explica cada término técnico. `tecnico`: términos y controles concretos (MFA, EDR, 3-2-1, CIS, OWASP, NIST). `empresa`: riesgo para el negocio, prioridad, esfuerzo y responsable.
3. Para hablar de la empresa usa SOLO el informe recibido. Nunca inventes vulnerabilidades, puertos, versiones, CVE ni resultados de escaneo.
4. Si no hay informe y preguntan por la empresa, sugiere hacer la evaluación.
5. Recuerda que el informe es una evaluación basada en respuestas, no vulnerabilidades confirmadas.
6. Mientras el escaneo no esté conectado, no ofrezcas resultados de escaneo.
7. Solo enfoque defensivo: no des instrucciones para atacar, explotar fallas o acceder sin autorización.
8. Respuestas breves (≈150 palabras), listas con “- ”, **negritas** solo para lo más importante.

Además: límite de peticiones por usuario, registro de cada conversación (usuario, fecha, tokens) y validación de rol con el JWT.

## seguridad-service
| Endpoint | Rol | Qué hace |
|---|---|---|
| `POST /api/seguridad/evaluaciones` | EMPRESA, ADMINISTRADOR | Guarda las respuestas y el informe (el motor de reglas puede vivir también aquí). |
| `POST /api/seguridad/activos` | EMPRESA, ADMINISTRADOR | Registra un dominio o una IP pública. Genera y guarda el código de verificación. Rechaza rangos, comodines e IP privadas. |
| `POST /api/seguridad/activos/{id}/verificacion` | EMPRESA, ADMINISTRADOR | Comprueba el registro DNS TXT o `/.well-known/edusecurity.txt`. |
| `POST /api/seguridad/escaneos` | EMPRESA, ADMINISTRADOR | Solo para activos verificados. Herramientas no intrusivas (TLS, cabeceras, lista corta de puertos). Máximo 1 escaneo por activo cada 24 h, velocidad limitada, horario elegido. Sin explotación ni pruebas destructivas. |

Todo queda en un registro de auditoría (quién, qué activo, cuándo, resultado). Los resultados solo los ve la empresa dueña.
Los hallazgos confirmados por escaneo se devuelven con `tipo: "confirmado"`, `cve` y `cvss`; el PDF del frontend ya los sabe mostrar.
