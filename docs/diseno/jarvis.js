/* =====================================================================
   JARVIS · asistente de ciberseguridad de EduSecurity
   ---------------------------------------------------------------------
   Arquitectura (frontend):
   - IA: proveedor configurable. En la página publicada usa la capacidad
     "sample" del visor (IA real, sin claves en el navegador). En la
     plataforma se cambia a "backend": el ia-service del API Gateway
     guarda la clave y aplica permisos por rol (JWT).
   - Evaluación por formulario: motor de reglas local y determinista.
     Sus resultados son RIESGOS según respuestas, nunca vulnerabilidades
     confirmadas.
   - Escaneo: flujo de autorización y alcance listo; el motor de escaneo
     vive en el backend (seguridad-service). Mientras no esté conectado,
     no se ejecuta ni se muestra ningún resultado.
   ===================================================================== */
(function () {
  "use strict";

  var CONFIG = {
    aiProvider: "artifact",                       // "artifact" | "backend"
    endpoints: {                                  // rutas previstas en el API Gateway
      chat: "/api/ia/jarvis/chat",
      evaluaciones: "/api/seguridad/evaluaciones",
      activos: "/api/seguridad/activos",
      verificacion: "/api/seguridad/activos/{id}/verificacion",
      escaneos: "/api/seguridad/escaneos"
    },
    scanServiceConnected: false                   // true solo cuando el seguridad-service responda
  };

  var M = window.JarvisMascot;
  var doc = document.documentElement;
  function calm() { return doc.classList.contains("calm") || window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function announce(t) { var l = $("#a11yLive"); if (!l) return; l.textContent = ""; setTimeout(function () { l.textContent = t; }, 60); }
  function now() { var d = new Date(); return d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" }); }
  function md(text) {
    var lines = esc(text).split(/\n/), out = "", list = null;
    function inl(s) { return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>"); }
    lines.forEach(function (ln) {
      var m;
      if ((m = ln.match(/^\s*[-•*]\s+(.*)/))) { if (list !== "ul") { if (list) out += "</" + list + ">"; out += "<ul>"; list = "ul"; } out += "<li>" + inl(m[1]) + "</li>"; return; }
      if ((m = ln.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== "ol") { if (list) out += "</" + list + ">"; out += "<ol>"; list = "ol"; } out += "<li>" + inl(m[1]) + "</li>"; return; }
      if (list) { out += "</" + list + ">"; list = null; }
      if ((m = ln.match(/^#{1,4}\s+(.*)/))) { out += "<p><strong>" + inl(m[1]) + "</strong></p>"; return; }
      if (ln.trim()) out += "<p>" + inl(ln) + "</p>";
    });
    if (list) out += "</" + list + ">";
    return out;
  }

  /* ---------------- Estado ---------------- */
  var S = {
    level: load("jv-level", "sencillo"),
    turns: [],
    report: load("jv-report", null),
    log: load("jv-log", []),
    scans: load("jv-scans", []),
    answers: load("jv-draft", {}),
    step: 0,
    busy: false,
    sample: null
  };
  function addLog(t) { S.log.unshift({ t: new Date().toISOString(), m: t }); S.log = S.log.slice(0, 40); store("jv-log", S.log); renderLog(); }

  /* =====================================================================
     1. EVALUACIÓN POR FORMULARIO
     ===================================================================== */
  var STEPS = [
    { title: "Tu empresa", why: "Con esto ajusto las recomendaciones a tu tamaño y sector.", qs: [
      { id: "empresa", type: "text", label: "Nombre de la empresa", hint: "Solo para el encabezado del informe.", required: true, ph: "Ej.: Ferretería La Esquina" },
      { id: "sector", type: "select", label: "Sector", required: true, options: ["Comercio", "Educación", "Salud", "Servicios financieros", "Tecnología", "Gobierno", "Manufactura", "Turismo y hotelería", "Otro"] },
      { id: "empleados", type: "radio", label: "¿Cuántas personas trabajan?", required: true, options: [["1-10", "1 a 10"], ["11-50", "11 a 50"], ["51-200", "51 a 200"], ["200+", "Más de 200"]] }
    ] },
    { title: "Equipos y servicios", why: "Saber qué usan me ayuda a ver por dónde podría entrar un atacante.", qs: [
      { id: "infra", type: "radio", label: "¿Dónde están sus sistemas?", hint: "<b>En la nube</b> significa que otra empresa guarda tus programas y archivos en Internet (por ejemplo, Google o Microsoft).", required: true, options: [["nube", "Casi todo en la nube"], ["mixta", "Una mezcla de nube y equipos propios"], ["propia", "Principalmente en servidores propios"], ["basica", "Solo computadores de oficina"]] },
      { id: "servidores", type: "radio", label: "¿Tienen servidores propios en la oficina?", hint: "Un <b>servidor</b> es un computador que presta un servicio a los demás, como guardar archivos o el sistema contable.", required: true, options: [["si", "Sí"], ["no", "No"], ["nose", "No lo sé"]] },
      { id: "nube", type: "check", label: "¿Qué servicios en la nube usan?", hint: "Marca todos los que apliquen.", options: [["m365", "Microsoft 365 / Outlook"], ["google", "Google Workspace / Gmail"], ["aws", "Amazon Web Services"], ["azure", "Microsoft Azure"], ["otra", "Otro"], ["ninguna", "Ninguno"]] },
      { id: "web", type: "check", label: "¿Qué tienen publicado en Internet?", hint: "Todo lo que se ve desde Internet puede ser buscado por atacantes.", options: [["sitio", "Página web"], ["tienda", "Tienda en línea o pagos"], ["app", "Aplicación móvil"], ["interno", "Un sistema interno al que se entra desde fuera (contabilidad, archivos, escritorio remoto)"], ["ninguno", "Nada"]] }
    ] },
    { title: "Acceso y contraseñas", why: "La mayoría de los ataques empieza con una contraseña robada.", qs: [
      { id: "auth", type: "check", label: "¿Cómo entran las personas a los sistemas?", options: [["clave", "Usuario y contraseña"], ["mfa", "Verificación en dos pasos (un código además de la clave)"], ["sso", "Un solo inicio de sesión para todo (SSO)"], ["compartida", "Algunas cuentas se comparten entre varias personas"]] },
      { id: "mfa", type: "radio", label: "¿Quiénes usan verificación en dos pasos?", hint: "Es el <b>código extra</b> que llega al celular o a una aplicación después de escribir la contraseña.", required: true, options: [["todos", "Todas las personas"], ["admins", "Solo administradores o algunos cargos"], ["nadie", "Nadie"], ["nose", "No lo sé"]] },
      { id: "politica", type: "radio", label: "¿Tienen reglas para las contraseñas?", required: true, options: [["ninguna", "No hay reglas"], ["basica", "Solo un largo mínimo"], ["completa", "Largo mínimo, no repetir claves y un gestor de contraseñas"]] }
    ] },
    { title: "Protección y copias", why: "Si algo sale mal, estas defensas deciden si es un susto o una catástrofe.", qs: [
      { id: "backup", type: "radio", label: "¿Hacen copias de seguridad?", hint: "Una <b>copia de seguridad</b> es un duplicado de la información para recuperarla si se daña o la secuestran.", required: true, options: [["no", "No"], ["manual", "A veces, a mano"], ["auto", "Automáticas"], ["auto-off", "Automáticas, con una copia desconectada y probada"]] },
      { id: "antivirus", type: "radio", label: "¿Los equipos tienen antivirus?", required: true, options: [["ninguno", "No"], ["algunos", "Algunos equipos"], ["todos", "Todos los equipos"], ["central", "Todos, administrados desde una consola central (EDR)"]] },
      { id: "firewall", type: "radio", label: "¿Hay un firewall que proteja la red?", hint: "Un <b>firewall</b> es un filtro que decide qué puede entrar o salir de la red.", required: true, options: [["si", "Sí"], ["no", "No"], ["nose", "No lo sé"]] },
      { id: "updates", type: "radio", label: "¿Cómo se actualizan los equipos y programas?", required: true, options: [["auto", "Automáticamente"], ["manual", "A mano, cuando alguien se acuerda"], ["nunca", "Casi nunca"], ["nose", "No lo sé"]] }
    ] },
    { title: "Personas e incidentes", why: "La gente es la primera línea de defensa.", qs: [
      { id: "capacitacion", type: "radio", label: "¿Capacitan al equipo en ciberseguridad?", required: true, options: [["nunca", "Nunca"], ["ingreso", "Solo al entrar a la empresa"], ["anual", "Al menos una vez al año"], ["periodica", "Varias veces al año, con simulacros"]] },
      { id: "incidentes", type: "check", label: "¿Han tenido alguno de estos problemas?", hint: "Esto queda solo en tu informe.", options: [["phishing", "Alguien cayó en un correo o mensaje falso"], ["ransomware", "Secuestro de archivos (ransomware)"], ["cuenta", "Robo de una cuenta"], ["fuga", "Fuga o pérdida de datos"], ["ninguno", "Ninguno"], ["nose", "No lo sé"]] },
      { id: "plan", type: "radio", label: "¿Saben qué hacer si ocurre un ataque?", hint: "Un <b>plan de respuesta</b> dice quién hace qué, a quién se avisa y cómo se recupera.", required: true, options: [["si", "Sí, está escrito"], ["informal", "Más o menos, no está escrito"], ["no", "No"]] }
    ] }
  ];
  var LABEL = {}; STEPS.forEach(function (s) { s.qs.forEach(function (q) { LABEL[q.id] = q; }); });
  function optLabel(id, v) { var q = LABEL[id]; if (!q || !q.options) return v; for (var i = 0; i < q.options.length; i++) { var o = q.options[i]; if ((o[0] || o) === v) return o[1] || o; } return v; }
  function ans(id) { return S.answers[id]; }
  function has(id, v) { return (S.answers[id] || []).indexOf(v) > -1; }

  /* Motor de reglas: cada regla mira las respuestas y produce un hallazgo explicable */
  var SEV = ["Crítico", "Alto", "Medio", "Bajo", "Informativo"], SEVW = { "Crítico": 22, "Alto": 12, "Medio": 6, "Bajo": 3, "Informativo": 0 };
  function evaluate(a) {
    var F = [];
    function add(f) { F.push(f); }
    var cloudMail = (a.nube || []).some(function (x) { return x === "m365" || x === "google"; });
    var exposed = (a.web || []).indexOf("interno") > -1;
    var badIncidents = (a.incidentes || []).filter(function (x) { return ["phishing", "ransomware", "cuenta", "fuga"].indexOf(x) > -1; });

    if (a.mfa === "nadie" || a.mfa === "nose" || a.mfa === "admins") {
      var sev = a.mfa === "nadie" ? (cloudMail || exposed ? "Crítico" : "Alto") : a.mfa === "nose" ? "Medio" : "Medio";
      add({ id: "mfa", sev: sev, type: "riesgo", title: a.mfa === "admins" ? "La verificación en dos pasos no protege a todo el equipo" : "Las cuentas dependen solo de la contraseña",
        desc: "Si alguien roba o adivina una contraseña, puede entrar sin que nada lo detenga. Es la forma más común de robo de cuentas de correo.",
        cons: "Robo del correo empresarial, fraudes a clientes y proveedores en nombre de la empresa, acceso a documentos.",
        rec: "Activa la verificación en dos pasos para todas las cuentas, empezando por correo, administradores y banca. Prefiere aplicaciones de autenticación o llaves físicas antes que SMS.",
        tech: "Habilitar MFA obligatorio (Conditional Access en Microsoft 365 / 2SV forzada en Google Workspace). Bloquear autenticación heredada (IMAP/POP/SMTP básico).",
        ev: "Respuesta: “" + optLabel("mfa", a.mfa) + "”" + (cloudMail ? " y correo en la nube." : ".") });
    }
    if ((a.auth || []).indexOf("compartida") > -1) add({ id: "shared", sev: "Alto", type: "riesgo", title: "Se comparten cuentas entre varias personas",
      desc: "Cuando varias personas usan la misma cuenta, no se sabe quién hizo qué y la contraseña termina circulando por chats y papeles.",
      cons: "Imposible rastrear un incidente; exempleados que conservan el acceso.",
      rec: "Crea una cuenta personal para cada persona. Si una cuenta debe compartirse, guárdala en un gestor de contraseñas con acceso controlado.",
      tech: "Cuentas nominativas, RBAC y bóveda de secretos con registro de accesos. Rotar credenciales compartidas al salir alguien del equipo.",
      ev: "Marcaste “Algunas cuentas se comparten entre varias personas”." });
    if (a.politica === "ninguna" || a.politica === "basica") add({ id: "pwd", sev: a.politica === "ninguna" ? "Alto" : "Medio", type: "riesgo", title: a.politica === "ninguna" ? "No hay reglas para las contraseñas" : "Las reglas de contraseñas son mínimas",
      desc: "Las contraseñas cortas o repetidas en varios sitios se adivinan o se filtran fácilmente.",
      cons: "Si una clave se filtra en otro sitio, sirve para entrar a los sistemas de la empresa.",
      rec: "Pide frases largas (14 caracteres o más), prohíbe repetirlas entre servicios y entrega un gestor de contraseñas al equipo.",
      tech: "Política alineada con NIST SP 800-63B: longitud mínima, listas de contraseñas comprometidas, sin caducidad forzada sin motivo.",
      ev: "Respuesta: “" + optLabel("politica", a.politica) + "”." });
    if (a.backup !== "auto-off") {
      var bs = a.backup === "no" ? "Crítico" : a.backup === "manual" ? "Alto" : "Medio";
      if (badIncidents.indexOf("ransomware") > -1 && bs !== "Crítico") bs = "Crítico";
      add({ id: "backup", sev: bs, type: "riesgo", title: a.backup === "no" ? "No hay copias de seguridad" : a.backup === "manual" ? "Las copias de seguridad dependen de que alguien se acuerde" : "Las copias no tienen una versión desconectada",
        desc: "Sin una copia reciente y separada, un daño, un robo o un secuestro de archivos puede borrar años de trabajo.",
        cons: "Pérdida permanente de información o pago de un rescate sin garantía de recuperarla.",
        rec: "Sigue la regla 3-2-1: tres copias, en dos lugares distintos, una fuera de la oficina y desconectada. Prueba restaurar una vez al mes.",
        tech: "Copias inmutables o fuera de línea, cifradas, con pruebas de restauración documentadas (RPO/RTO definidos).",
        ev: "Respuesta: “" + optLabel("backup", a.backup) + "”" + (badIncidents.indexOf("ransomware") > -1 ? " y un antecedente de ransomware." : ".") });
    }
    if (a.antivirus === "ninguno" || a.antivirus === "algunos") add({ id: "av", sev: a.antivirus === "ninguno" ? "Alto" : "Medio", type: "riesgo", title: a.antivirus === "ninguno" ? "Los equipos no tienen antivirus" : "Solo algunos equipos tienen antivirus",
      desc: "Un solo equipo sin protección puede ser la puerta de entrada para todo lo demás.",
      cons: "Infección que se extiende por la red; robo de contraseñas guardadas en el navegador.",
      rec: "Instala protección en todos los equipos y revisa que esté activa y actualizada.",
      tech: "Desplegar EDR con gestión centralizada y alertas; cubrir servidores y portátiles.", ev: "Respuesta: “" + optLabel("antivirus", a.antivirus) + "”." });
    if (a.firewall !== "si") add({ id: "fw", sev: a.firewall === "no" ? "Alto" : "Medio", type: a.firewall === "no" ? "riesgo" : "preventivo", title: a.firewall === "no" ? "La red no tiene firewall" : "No se sabe si hay un firewall",
      desc: "Sin un filtro, cualquier servicio de la red puede quedar visible desde Internet.", cons: "Servicios internos expuestos a intentos de acceso automáticos.",
      rec: "Confirma con tu proveedor de Internet o de sistemas que el router tenga firewall activo y que solo esté abierto lo necesario.",
      tech: "Política de denegar por defecto, revisión de reglas NAT/port-forwarding y registro de conexiones.", ev: "Respuesta: “" + optLabel("firewall", a.firewall) + "”." });
    if (a.updates !== "auto") add({ id: "upd", sev: a.updates === "manual" ? "Medio" : "Alto", type: "riesgo", title: "Los equipos y programas no se actualizan a tiempo",
      desc: "Las actualizaciones cierran fallas que los atacantes ya conocen y aprovechan.", cons: "Infecciones a través de fallas públicas que tienen arreglo disponible.",
      rec: "Activa las actualizaciones automáticas en equipos, navegadores y programas, y revisa una vez al mes que estén al día.",
      tech: "Gestión de parches con inventario de software y SLA por criticidad (CVSS ≥ 9: menos de 7 días).", ev: "Respuesta: “" + optLabel("updates", a.updates) + "”." });
    if (a.capacitacion !== "periodica") add({ id: "train", sev: a.capacitacion === "nunca" ? "Alto" : a.capacitacion === "ingreso" ? "Medio" : "Bajo", type: "riesgo", title: a.capacitacion === "nunca" ? "El equipo no ha recibido capacitación en seguridad" : "La capacitación en seguridad es poco frecuente",
      desc: "La mayoría de los ataques empieza con un correo o una llamada falsa que alguien no reconoció.", cons: "Clics en enlaces falsos, contraseñas entregadas, transferencias fraudulentas.",
      rec: "Programa capacitaciones cortas varias veces al año con simulacros de phishing. Los módulos de EduSecurity sirven para esto.",
      tech: "Programa de concienciación con métricas (tasa de clic en simulacros, reportes de phishing).", ev: "Respuesta: “" + optLabel("capacitacion", a.capacitacion) + "”." });
    if (exposed) add({ id: "exposed", sev: a.servidores === "si" ? "Alto" : "Medio", type: "riesgo", title: "Hay sistemas internos accesibles desde Internet",
      desc: "Un sistema pensado para la oficina que se abre a Internet queda al alcance de ataques automáticos todo el día.", cons: "Acceso no autorizado a contabilidad, archivos o escritorios remotos.",
      rec: "Pon esos sistemas detrás de una VPN o de un acceso con verificación en dos pasos, y cierra lo que no se use.",
      tech: "No exponer RDP/SMB/paneles de administración; usar VPN o ZTNA con MFA. Este punto debe confirmarse con un escaneo autorizado.", ev: "Marcaste “Un sistema interno al que se entra desde fuera”." });
    if (badIncidents.length) add({ id: "inc", sev: a.plan === "si" ? "Medio" : "Alto", type: "riesgo", title: "Hubo incidentes de seguridad antes",
      desc: "Un incidente pasado muestra que la empresa ya está en la mira y que alguna defensa falló.", cons: "Repetición del ataque por la misma vía si no se corrigió la causa.",
      rec: "Revisa qué permitió cada incidente y confirma que esa causa ya está corregida.", tech: "Análisis de causa raíz y lecciones aprendidas documentadas por incidente.",
      ev: "Antecedentes: " + badIncidents.map(function (x) { return optLabel("incidentes", x); }).join("; ") + "." });
    if (a.plan !== "si") add({ id: "plan", sev: "Medio", type: "preventivo", title: "No hay un plan escrito para responder a un ataque",
      desc: "Durante un ataque se pierde tiempo valioso decidiendo quién hace qué.", cons: "Más daño, más tiempo sin operar y avisos tardíos a clientes o autoridades.",
      rec: "Escribe una página con: a quién llamar, cómo aislar un equipo, dónde están las copias y cómo avisar a clientes.", tech: "Plan de respuesta a incidentes con roles, contactos y runbooks (NIST SP 800-61).", ev: "Respuesta: “" + optLabel("plan", a.plan) + "”." });
    if ((a.web || []).indexOf("tienda") > -1) add({ id: "pay", sev: "Medio", type: "preventivo", title: "Manejan pagos o datos de clientes en línea",
      desc: "Las tiendas en línea son un objetivo atractivo porque manejan datos de tarjetas y personales.", cons: "Robo de datos de clientes y problemas legales.",
      rec: "Usa una pasarela de pagos certificada en lugar de guardar tarjetas, y revisa el sitio con un escaneo autorizado.", tech: "Cumplimiento PCI DSS mediante pasarela; cabeceras de seguridad, TLS vigente y WAF.", ev: "Marcaste “Tienda en línea o pagos”." });
    if ((a.web || []).some(function (x) { return x === "sitio" || x === "tienda" || x === "app"; })) add({ id: "scan", sev: "Informativo", type: "preventivo", title: "Tus servicios públicos aún no tienen una revisión técnica",
      desc: "Este informe se basa en tus respuestas. Para confirmar fallas reales en tu página o aplicación hace falta un escaneo técnico autorizado.", cons: "Pueden existir problemas que solo un escaneo detecta (certificados, configuración, versiones).",
      rec: "Cuando el servicio de escaneo esté disponible, registra tu dominio en “Escaneo técnico” y verifica que es tuyo.", tech: "Revisión de TLS, cabeceras HTTP, servicios expuestos y versiones con herramientas no intrusivas.", ev: "Tienes servicios publicados en Internet." });
    if (["Salud", "Servicios financieros", "Educación", "Gobierno"].indexOf(a.sector) > -1) add({ id: "law", sev: "Informativo", type: "preventivo", title: "Tu sector maneja datos personales sensibles",
      desc: "En Colombia, la Ley 1581 de 2012 obliga a proteger los datos personales que la empresa recoge.", cons: "Sanciones y pérdida de confianza si se filtran datos.",
      rec: "Revisa tu política de tratamiento de datos y quién puede ver la información sensible.", tech: "Clasificación de datos, control de acceso por mínimo privilegio y registro de accesos.", ev: "Sector: " + a.sector + "." });
    if ((a.empleados === "51-200" || a.empleados === "200+") && (a.auth || []).indexOf("sso") === -1) add({ id: "sso", sev: "Bajo", type: "preventivo", title: "Las cuentas no están centralizadas",
      desc: "Con muchas personas, administrar cuentas por separado hace fácil olvidar quitar accesos.", cons: "Cuentas activas de personas que ya no trabajan en la empresa.",
      rec: "Centraliza el acceso con un inicio de sesión único y un proceso para dar y quitar permisos.", tech: "IdP con SSO (SAML/OIDC) y aprovisionamiento automático (SCIM).", ev: "Tamaño: " + optLabel("empleados", a.empleados) + ", sin SSO." });

    F.sort(function (x, y) { return SEV.indexOf(x.sev) - SEV.indexOf(y.sev); });
    F.forEach(function (f, i) { f.prio = i + 1; });
    var score = Math.max(5, 100 - F.reduce(function (s, f) { return s + SEVW[f.sev]; }, 0));
    var level = score >= 80 ? "Buena base de seguridad" : score >= 60 ? "Aceptable, con mejoras pendientes" : score >= 40 ? "Riesgo considerable" : "Riesgo alto";
    var assets = [];
    assets.push(["Infraestructura", optLabel("infra", a.infra)]);
    if (a.servidores === "si") assets.push(["Servidores", "Servidores propios en la oficina"]);
    (a.nube || []).filter(function (x) { return x !== "ninguna"; }).forEach(function (x) { assets.push(["Nube", optLabel("nube", x)]); });
    (a.web || []).filter(function (x) { return x !== "ninguno"; }).forEach(function (x) { assets.push(["En Internet", optLabel("web", x)]); });
    var counts = {}; SEV.forEach(function (s) { counts[s] = F.filter(function (f) { return f.sev === s; }).length; });
    var top = F.filter(function (f) { return f.sev === "Crítico" || f.sev === "Alto"; }).slice(0, 3).map(function (f) { return f.title.toLowerCase(); });
    var concl = [
      "Según tus respuestas, " + (a.empresa || "la empresa") + " tiene un nivel de seguridad “" + level.toLowerCase() + "” (" + score + " de 100).",
      top.length ? "Lo más urgente: " + top.join("; ") + "." : "No aparecen riesgos críticos ni altos en tus respuestas. Mantén las buenas prácticas y revísalas cada seis meses.",
      "Este informe no confirma vulnerabilidades técnicas: se basa solo en lo que respondiste. Para confirmarlas hace falta un escaneo autorizado de tus servicios."
    ];
    return { v: 1, fecha: new Date().toISOString(), empresa: a.empresa, sector: a.sector, empleados: optLabel("empleados", a.empleados), score: score, level: level, counts: counts, assets: assets, findings: F, concl: concl, answers: JSON.parse(JSON.stringify(a)), aiSummary: null };
  }

  /* =====================================================================
     2. CONSTRUCCIÓN DE LA INTERFAZ
     ===================================================================== */
  var ICON = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4Z"/></svg>',
    form: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M21 12h-3"/></svg>',
    rep: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 9v4M12 16.5v.5"/><path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
  };

  var app = document.createElement("div");
  app.className = "jv-app"; app.id = "jarvisApp"; app.hidden = true;
  app.setAttribute("role", "dialog"); app.setAttribute("aria-modal", "true"); app.setAttribute("aria-labelledby", "jvTitle");
  app.innerHTML =
    '<div class="jv-top">' +
      '<div class="jv-brand">' + M.avatarIcon("idle") + '<div><b id="jvTitle">JARVIS</b><small>Asistente de ciberseguridad de EduSecurity</small></div></div>' +
      '<label class="jv-level"><span>Explícame</span><select id="jvLevel" aria-label="Nivel de explicación"><option value="sencillo">Con palabras sencillas</option><option value="tecnico">Con detalle técnico</option><option value="empresa">Para la gerencia de una empresa</option></select></label>' +
      '<button class="btn btn-ghost btn-sm" type="button" id="jvClose">Volver a EduSecurity</button>' +
    '</div>' +
    '<div class="jv-tabs" role="tablist" aria-label="Herramientas de JARVIS">' +
      '<button class="jv-tab" role="tab" id="jvt-chat" aria-controls="jvp-chat" aria-selected="true">' + ICON.chat + 'Conversar</button>' +
      '<button class="jv-tab" role="tab" id="jvt-eval" aria-controls="jvp-eval" aria-selected="false" tabindex="-1">' + ICON.form + 'Evaluar mi empresa</button>' +
      '<button class="jv-tab" role="tab" id="jvt-rep" aria-controls="jvp-rep" aria-selected="false" tabindex="-1">' + ICON.rep + 'Informe</button>' +
      '<button class="jv-tab" role="tab" id="jvt-scan" aria-controls="jvp-scan" aria-selected="false" tabindex="-1">' + ICON.scan + 'Escaneo técnico <span class="pill">Por conectar</span></button>' +
    '</div>' +
    '<div class="jv-body" id="jvBody">' +
      /* --- Conversar --- */
      '<section class="jv-panel" role="tabpanel" id="jvp-chat" aria-labelledby="jvt-chat">' +
        '<div class="jv-chat">' +
          '<aside class="jv-core" aria-label="Estado de JARVIS">' +
            '<div class="jv-holo" id="jvHolo"></div>' +
            '<div class="jv-status" role="status"><span class="jv-led" id="jvLed"></span><span id="jvStatus">Listo para ayudarte</span></div>' +
            '<div class="jv-ctx" id="jvCtx"></div>' +
          '</aside>' +
          '<div class="jv-conv">' +
            '<div class="jv-off" id="jvOff" hidden></div>' +
            '<div class="jv-log" id="jvLog" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversación con JARVIS"></div>' +
            '<div class="jv-sugg" id="jvSugg" aria-label="Preguntas sugeridas"></div>' +
            '<form class="jv-input" id="jvForm"><label for="jvText" class="sr-only">Escribe tu pregunta para JARVIS</label>' +
              '<textarea id="jvText" rows="1" placeholder="Escribe tu pregunta…" maxlength="1500"></textarea>' +
              '<button class="jv-send" type="submit" id="jvSend" aria-label="Enviar pregunta">' + ICON.send + '</button></form>' +
            '<p class="jv-note">Enter envía · Mayús + Enter agrega una línea. JARVIS puede equivocarse: confirma lo importante con tu equipo de sistemas.</p>' +
          '</div>' +
        '</div>' +
      '</section>' +
      /* --- Evaluar --- */
      '<section class="jv-panel" role="tabpanel" id="jvp-eval" aria-labelledby="jvt-eval" hidden>' +
        '<h2 class="jv-h">Evaluación de seguridad de tu empresa <span class="jv-zone">Área empresarial</span></h2>' +
        '<p class="jv-sub">Responde cinco pasos cortos sobre cómo trabaja tu empresa. Con tus respuestas preparo una evaluación inicial con riesgos, prioridades y recomendaciones. Toma unos 5 minutos y puedes volver atrás cuando quieras.</p>' +
        '<div class="wiz"><ol class="wiz-steps" id="wizSteps"></ol><div class="wiz-card" id="wizCard"></div></div>' +
      '</section>' +
      /* --- Informe --- */
      '<section class="jv-panel" role="tabpanel" id="jvp-rep" aria-labelledby="jvt-rep" hidden><div id="repWrap"></div></section>' +
      /* --- Escaneo --- */
      '<section class="jv-panel" role="tabpanel" id="jvp-scan" aria-labelledby="jvt-scan" hidden>' +
        '<h2 class="jv-h">Escaneo técnico autorizado <span class="jv-zone">Área empresarial</span></h2>' +
        '<p class="jv-sub">Revisa desde Internet lo que tu empresa tiene expuesto: certificados, configuración web, servicios abiertos y versiones visibles. Solo se puede escanear lo que es tuyo o lo que tienes permiso escrito para revisar.</p>' +
        '<div class="disclaimer" style="margin-top:1rem">' + ICON.warn + '<div><b>El servicio de escaneo todavía no está conectado.</b> Puedes registrar el activo y preparar la verificación de propiedad, pero no se ejecutará ninguna revisión ni se mostrarán resultados hasta que el equipo conecte el motor de escaneo del backend.</div></div>' +
        '<div class="scan-grid">' +
          '<div class="rcard"><h3>1. Registrar un activo</h3><form id="scanForm" novalidate>' +
            '<fieldset class="q"><legend>¿Qué quieres revisar?</legend><div class="opts">' +
              '<label class="opt-c"><input type="radio" name="stype" value="dominio" checked> <span>Dominio<small>ej.: miempresa.com</small></span></label>' +
              '<label class="opt-c"><input type="radio" name="stype" value="ip"> <span>Dirección IP pública<small>una sola dirección</small></span></label></div></fieldset>' +
            '<div class="q"><label class="ql" for="scanTarget">Dominio o dirección IP</label><span class="hint" id="scanHint">Escribe un solo dominio o una sola IP. No se aceptan rangos ni comodines.</span>' +
              '<input type="text" id="scanTarget" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="scanHint scanErr" placeholder="miempresa.com"><span class="err" id="scanErr" aria-live="polite"></span></div>' +
            '<fieldset class="q"><legend>Confirmación de autorización</legend><span class="hint">Las tres son obligatorias. Escanear sistemas ajenos sin permiso puede ser un delito (Ley 1273 de 2009).</span>' +
              '<label class="opt-c"><input type="checkbox" id="auth1"> <span>Este activo es de mi empresa o tengo autorización escrita de su dueño.</span></label>' +
              '<label class="opt-c" style="margin-top:.5rem"><input type="checkbox" id="auth2"> <span>Entiendo que la revisión es solo de diagnóstico: no se explotarán fallas ni se harán pruebas destructivas.</span></label>' +
              '<label class="opt-c" style="margin-top:.5rem"><input type="checkbox" id="auth3"> <span>Avisé al responsable del servicio (o a mi proveedor de hosting) sobre esta revisión.</span></label>' +
              '<span class="err" id="authErr" aria-live="polite"></span></fieldset>' +
            '<div class="q"><label class="ql" for="scanWindow">Horario permitido</label><select id="scanWindow"><option>Fuera de horario laboral (7 p. m. – 6 a. m.)</option><option>Fines de semana</option><option>Cualquier hora</option></select></div>' +
            '<button class="btn btn-primary" type="submit">Registrar activo y obtener código de verificación</button></form>' +
            '<div id="scanResult" aria-live="polite"></div></div>' +
          '<div style="display:grid;gap:1.2rem;align-content:start">' +
            '<div class="rcard"><h3>2. Lo que revisará el escaneo</h3><ul class="svc" id="svcList"></ul></div>' +
            '<div class="rcard"><h3>Reglas de seguridad del escaneo</h3><ul class="svc">' +
              '<li>' + ICON.lock + '<span>Solo activos verificados<small>Antes de escanear se confirma que el dominio es tuyo con un registro DNS o un archivo en tu sitio.</small></span></li>' +
              '<li>' + ICON.lock + '<span>Sin explotación ni pruebas destructivas<small>Solo se observa; nunca se intenta entrar ni se envían ataques.</small></span></li>' +
              '<li>' + ICON.lock + '<span>Velocidad limitada<small>Pocas conexiones por segundo y un escaneo por activo cada 24 horas.</small></span></li>' +
              '<li>' + ICON.lock + '<span>Resultados protegidos<small>Solo los ven las personas de tu empresa con permiso. Todo queda registrado.</small></span></li></ul></div>' +
            '<div class="rcard"><h3>Registro de actividad</h3><ul class="logl" id="jvLogList"></ul><p class="jv-note" style="padding:0;margin-top:.6rem">Se guarda en este navegador mientras el registro del servidor no esté conectado.</p></div>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>';
  document.body.appendChild(app);

  var launch = document.createElement("button");
  launch.className = "jv-launch"; launch.type = "button"; launch.id = "jvLaunch";
  launch.innerHTML = M.avatarIcon("idle") + "<span>Pregúntale a JARVIS</span>";
  launch.setAttribute("aria-label", "Abrir JARVIS, el asistente de ciberseguridad");
  document.body.appendChild(launch);

  /* ---------------- Abrir / cerrar y pestañas ---------------- */
  var lastFocus = null, cur = "chat";
  function openApp(tab) {
    lastFocus = document.activeElement; app.hidden = false; document.body.style.overflow = "hidden"; launch.hidden = true;
    showTab(tab || cur, false);
    if (!calm()) app.animate([{ opacity: 0, transform: "scale(.985)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.23,1,.32,1)" });
    setTimeout(function () { (cur === "chat" ? $("#jvText") : $("#jvt-" + cur)).focus(); }, 60);
    if (location.hash !== "#jarvis") history.replaceState(null, "", "#jarvis");
    initAI();
  }
  function closeApp() {
    app.hidden = true; document.body.style.overflow = ""; launch.hidden = false;
    if (location.hash === "#jarvis") history.replaceState(null, "", location.pathname + location.search);
    (lastFocus && lastFocus.focus ? lastFocus : launch).focus();
  }
  var TABS = ["chat", "eval", "rep", "scan"];
  function showTab(t, focus) {
    cur = t;
    TABS.forEach(function (x) { var b = $("#jvt-" + x), p = $("#jvp-" + x); var on = x === t; b.setAttribute("aria-selected", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; p.hidden = !on; });
    if (t === "rep") renderReport();
    if (t === "eval") renderWizard();
    if (focus) $("#jvt-" + t).focus();
    $("#jvBody").scrollTop = 0;
  }
  TABS.forEach(function (x) { $("#jvt-" + x).addEventListener("click", function () { showTab(x); }); });
  $(".jv-tabs", app).addEventListener("keydown", function (e) {
    var i = TABS.indexOf(cur);
    if (e.key === "ArrowRight") { e.preventDefault(); showTab(TABS[(i + 1) % 4], true); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); showTab(TABS[(i + 3) % 4], true); }
  });
  launch.addEventListener("click", function () { openApp("chat"); });
  $("#jvClose").addEventListener("click", closeApp);
  app.addEventListener("keydown", function (e) { if (e.key === "Escape" && !/TEXTAREA|INPUT|SELECT/.test(e.target.tagName)) { e.preventDefault(); closeApp(); } });
  document.querySelectorAll('a[href="#jarvis"]').forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); openApp("chat"); }); });
  window.addEventListener("hashchange", function () { if (location.hash === "#jarvis" && app.hidden) openApp(); });
  if (location.hash === "#jarvis") setTimeout(function () { openApp(); }, 200);
  var lv = $("#jvLevel"); lv.value = S.level;
  lv.addEventListener("change", function () { S.level = lv.value; store("jv-level", S.level); announce("JARVIS explicará " + lv.options[lv.selectedIndex].text.toLowerCase()); if (cur === "rep") renderReport(); });

  /* ---------------- Personaje y contexto ---------------- */
  var holo = $("#jvHolo"), curState = "";
  function setMascot(state, status, busy) {
    if (state !== curState) { holo.innerHTML = M.avatar(state); if (!calm()) holo.firstChild.classList.add("jv-swap"); curState = state; }
    if (status) $("#jvStatus").textContent = status;
    var led = $("#jvLed"); led.className = "jv-led" + (busy ? " busy" : S.sample === false ? " off" : "");
  }
  function restState() { if (!S.report) return "welcome"; var c = S.report.counts; return c["Crítico"] ? "alert" : S.report.score >= 80 ? "ok" : "idle"; }
  function gauge(score, size) {
    var r = 36, C = 2 * Math.PI * r, col = score >= 80 ? "var(--tide)" : score >= 60 ? "#ffd166" : score >= 40 ? "#ff9b54" : "#ff6b6b";
    return '<svg viewBox="0 0 84 84" aria-hidden="true" style="width:' + (size || 84) + 'px;height:' + (size || 84) + 'px"><circle class="trk" cx="42" cy="42" r="' + r + '" fill="none" stroke-width="8"/><circle cx="42" cy="42" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - score / 100)).toFixed(1) + '"/></svg>';
  }
  function sevChips(counts) { return SEV.filter(function (s) { return counts[s]; }).map(function (s) { return '<span class="sev sev-' + slug(s) + '">' + counts[s] + " " + s.toLowerCase() + "</span>"; }).join(""); }
  function slug(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function renderCtx() {
    var c = $("#jvCtx");
    if (!S.report) { c.innerHTML = '<h3>Sin evaluación todavía</h3><p>Para hablar de tu empresa necesito que primero respondas la evaluación. Mientras tanto, pregúntame lo que quieras sobre seguridad.</p><button class="btn btn-ghost btn-sm" type="button" style="margin-top:.8rem" data-go="eval">Evaluar mi empresa</button>'; }
    else { var r = S.report; c.innerHTML = '<h3>Evaluación de ' + esc(r.empresa) + '</h3><div class="jv-gauge"><div style="position:relative">' + gauge(r.score) + '</div><div><strong>' + r.score + '</strong><span style="color:var(--mist)"> / 100</span><div style="font-weight:600;font-size:.9rem">' + esc(r.level) + '</div></div></div><div class="jv-sev">' + sevChips(r.counts) + '</div><p style="margin-top:.7rem;font-size:.84rem">Basada en respuestas, no en un escaneo.</p><button class="btn btn-ghost btn-sm" type="button" style="margin-top:.8rem" data-go="rep">Ver informe</button>'; }
    $$("[data-go]", c).forEach(function (b) { b.addEventListener("click", function () { showTab(b.getAttribute("data-go"), true); }); });
  }

  /* =====================================================================
     3. CHAT CON IA
     ===================================================================== */
  var SUGG_GENERAL = ["¿Qué significa tener un puerto abierto?", "¿Cómo puedo proteger mi página web?", "¿Qué riesgos tiene usar contraseñas débiles?", "¿Qué es el phishing y cómo lo reconozco?"];
  var SUGG_REPORT = ["¿Qué tan segura está mi empresa?", "¿Qué debería corregir primero?", "Explícame el informe como si no supiera de informática", "¿Cómo soluciono el riesgo más grave?"];
  function renderSugg() { var list = S.report ? SUGG_REPORT : SUGG_GENERAL; $("#jvSugg").innerHTML = list.map(function (q) { return '<button type="button" class="chipq">' + esc(q) + "</button>"; }).join(""); $$(".chipq", $("#jvSugg")).forEach(function (b) { b.addEventListener("click", function () { send(b.textContent); }); }); }
  var LEVELS = {
    sencillo: "La persona no sabe de informática. Usa palabras cotidianas y un ejemplo de la vida diaria. Si usas un término técnico, explícalo en la misma frase.",
    tecnico: "La persona es administrador de sistemas. Puedes usar términos técnicos, nombres de controles (MFA, EDR, regla 3-2-1, CIS Controls, OWASP, NIST) y configuraciones concretas.",
    empresa: "La persona dirige o gerencia una empresa. Enfócate en el riesgo para el negocio, la prioridad, el esfuerzo aproximado (bajo, medio o alto) y quién debería encargarse."
  };
  function reportContext() {
    if (!S.report) return "NO HAY INFORME. La persona todavía no ha hecho la evaluación de su empresa.";
    var r = S.report;
    return "INFORME (evaluación basada en las respuestas del formulario; NO es un escaneo; no hay vulnerabilidades técnicas confirmadas):\n" + JSON.stringify({
      empresa: r.empresa, sector: r.sector, empleados: r.empleados, puntuacion: r.score + "/100", nivel: r.level, activos: r.assets.map(function (x) { return x[0] + ": " + x[1]; }),
      hallazgos: r.findings.map(function (f) { return { prioridad: f.prio, gravedad: f.sev, tipo: f.type === "riesgo" ? "posible riesgo según respuestas" : "recomendación preventiva", titulo: f.title, evidencia: f.ev, recomendacion: f.rec, detalle_tecnico: f.tech }; })
    });
  }
  function rules() {
    return "Eres JARVIS, el asistente de ciberseguridad de EduSecurity, una plataforma educativa colombiana que enseña a protegerse en Internet. Personalidad: profesional, amable, preciso y fácil de entender. Responde siempre en español.\n\n" +
      "Cómo explicar: " + LEVELS[S.level] + "\n\n" +
      "Reglas obligatorias:\n" +
      "1. Para hablar de la empresa de la persona usa SOLO el INFORME de abajo. Nunca inventes vulnerabilidades, puertos, versiones, CVE ni resultados de escaneo.\n" +
      "2. Si no hay informe y te preguntan por su empresa, dilo con amabilidad y sugiere usar la pestaña “Evaluar mi empresa”.\n" +
      "3. Cuando menciones el informe, recuerda que es una evaluación basada en respuestas, no vulnerabilidades confirmadas.\n" +
      "4. El escaneo técnico de EduSecurity aún no está conectado: no ofrezcas resultados de escaneo.\n" +
      "5. Solo enfoque defensivo. No des instrucciones para atacar, explotar fallas, saltarse controles ni acceder a sistemas sin autorización; en ese caso explica por qué no y ofrece la alternativa defensiva.\n" +
      "6. Si preguntan qué corregir primero, sigue la prioridad del informe.\n" +
      "7. Sé breve: unas 150 palabras como máximo, párrafos cortos y listas con “- ”. Usa **negritas** solo para lo más importante. Sin tablas ni encabezados.\n\n" + reportContext();
  }
  function addMsg(role, html, opts) {
    var log = $("#jvLog"), el = document.createElement("div");
    if (role === "user") { el.className = "msg user"; el.innerHTML = '<span class="sr-only">Tú: </span>' + html; }
    else {
      el.className = "msg bot" + (opts && opts.err ? " err" : "");
      el.innerHTML = '<div class="av" aria-hidden="true">' + M.avatarIcon(opts && opts.err ? "alert" : "idle") + '</div><div class="bubble-jv"><div class="who"><span>JARVIS</span><time>' + now() + '</time></div><div class="txt">' + html + "</div></div>";
    }
    log.appendChild(el); log.scrollTop = log.scrollHeight; return el;
  }
  function greet() {
    $("#jvLog").innerHTML = "";
    var g = S.report ? "Hola, soy **JARVIS**. Ya revisé la evaluación de **" + S.report.empresa + "**. Puedo explicarte cada riesgo, decirte qué corregir primero o resumir el informe." :
      "Hola, soy **JARVIS**, el asistente de ciberseguridad de EduSecurity. Pregúntame lo que quieras sobre seguridad en Internet, o evalúa tu empresa y te ayudo a entender los resultados.";
    addMsg("bot", md(g));
  }
  var ctl = null;
  function setBusy(b) {
    S.busy = b; var s = $("#jvSend");
    s.innerHTML = b ? ICON.stop : ICON.send; s.setAttribute("aria-label", b ? "Detener respuesta" : "Enviar pregunta"); s.type = b ? "button" : "submit";
  }
  $("#jvSend").addEventListener("click", function (e) { if (S.busy) { e.preventDefault(); if (ctl) ctl.abort(); } });
  function send(text) {
    text = String(text || "").trim(); if (!text || S.busy) return;
    if (!S.sample) { showOff(); return; }
    $("#jvText").value = ""; autoGrow();
    addMsg("user", esc(text));
    S.turns.push({ role: "user", content: text });
    var el = addMsg("bot", '<span class="typing" aria-label="JARVIS está pensando"><i></i><i></i><i></i> Analizando tu pregunta…</span><div class="scanbar" aria-hidden="true"></div>');
    var box = $(".txt", el);
    setBusy(true); setMascot("thinking", "Analizando tu pregunta…", true);
    ctl = new AbortController();
    var turns = [{ role: "user", content: rules() }].concat(S.turns.slice(-12));
    var started = false;
    S.sample(turns, { cache: false, signal: ctl.signal, onText: function (u) {
      if (!started) { started = true; setMascot("explaining", "Respondiendo…", true); }
      box.innerHTML = md(u.text);
      var log = $("#jvLog"); log.scrollTop = log.scrollHeight;
    } }).then(function (r) {
      S.turns.push({ role: "assistant", content: r.text });
      if (r.truncated) box.insertAdjacentHTML("beforeend", "<p><em>La respuesta se cortó. Pídeme que continúe o pregunta algo más concreto.</em></p>");
      setMascot(restState(), "Listo para ayudarte", false);
    }).catch(function (e) {
      S.turns.pop();
      var code = e && e.code;
      if (code === "cancelled") { box.innerHTML = e.text ? md(e.text) + "<p><em>Respuesta detenida.</em></p>" : "<p><em>Detuviste la respuesta.</em></p>"; setMascot(restState(), "Listo para ayudarte", false); return; }
      el.classList.add("err");
      var msg = { not_granted: "No tengo permiso para usar la IA en esta vista. Puedes activarlo desde el menú de permisos de la página.", sampling_disabled: "La IA no está disponible para esta cuenta.", rate_limited: "Recibí demasiadas preguntas seguidas. Espera un momento y vuelve a intentarlo.", session_expired: "Tu sesión expiró. Vuelve a iniciar sesión en Claude.", refused: "No puedo ayudar con esa solicitud. Si buscas proteger un sistema, cuéntame qué quieres asegurar.", prompt_too_large: "La conversación es muy larga. Recarga JARVIS para empezar de nuevo." }[code] || "No pude responder por un problema de conexión. Inténtalo de nuevo.";
      box.innerHTML = (e.text ? md(e.text) : "") + "<p><strong>" + esc(msg) + "</strong></p>";
      if (code === "not_granted" || code === "sampling_disabled") { S.sample = false; showOff(); }
      setMascot("alert", "No pude responder", false);
    }).then(function () { setBusy(false); ctl = null; });
  }
  $("#jvForm").addEventListener("submit", function (e) { e.preventDefault(); send($("#jvText").value); });
  var ta = $("#jvText");
  function autoGrow() { ta.style.height = "auto"; ta.style.height = Math.min(180, ta.scrollHeight) + "px"; }
  ta.addEventListener("input", autoGrow);
  ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(ta.value); } });
  function showOff() {
    var o = $("#jvOff"); o.hidden = false;
    o.innerHTML = "<b>El chat con IA no está disponible en esta vista.</b> En la página publicada de EduSecurity se conecta automáticamente; en la plataforma se conectará al servicio de IA del servidor. La evaluación, el informe y el PDF sí funcionan sin conexión a la IA.";
    $("#jvText").disabled = true; $("#jvSend").disabled = true; setMascot(restState(), "IA no conectada", false);
  }
  var aiInit = false;
  function initAI() {
    if (aiInit) return; aiInit = true;
    if (CONFIG.aiProvider === "backend") {
      // Proveedor del servidor: el ia-service guarda la clave y valida el rol del usuario.
      S.sample = function (turns, opt) {
        return fetch(CONFIG.endpoints.chat, { method: "POST", headers: { "Content-Type": "application/json" }, signal: opt.signal, body: JSON.stringify({ mensajes: turns, nivel: S.level }) })
          .then(function (r) { if (!r.ok) throw { code: r.status === 429 ? "rate_limited" : r.status === 401 ? "not_granted" : "upstream_error" }; return r.json(); })
          .then(function (d) { opt.onText && opt.onText({ text: d.respuesta, delta: d.respuesta }); return { text: d.respuesta, truncated: false }; });
      };
      return;
    }
    if (!window.claude || !window.claude.use) { S.sample = false; showOff(); return; }
    setMascot(curState || restState(), "Conectando…", true);
    window.claude.use("sample").then(function (fn) {
      if (!fn) { S.sample = false; showOff(); return; }
      S.sample = fn; setMascot(restState(), "Listo para ayudarte", false);
    }).catch(function () { S.sample = false; showOff(); });
  }

  /* =====================================================================
     4. ASISTENTE POR PASOS
     ===================================================================== */
  function renderWizard() {
    var ol = $("#wizSteps"), card = $("#wizCard"), total = STEPS.length + 1;
    ol.innerHTML = STEPS.concat([{ title: "Revisar y confirmar" }]).map(function (s, i) {
      return '<li' + (i === S.step ? ' aria-current="step"' : "") + (i < S.step ? ' class="done"' : "") + '><span class="n">' + (i < S.step ? "✓" : i + 1) + '</span><span class="t">' + esc(s.title) + (i < S.step ? '<span class="sr-only"> (completado)</span>' : "") + "</span></li>";
    }).join("");
    var pct = Math.round(S.step / (total - 1) * 100);
    var head = '<div class="wiz-prog" role="progressbar" aria-label="Avance de la evaluación" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>';
    if (S.step < STEPS.length) {
      var st = STEPS[S.step];
      card.innerHTML = head + '<h3 tabindex="-1" id="wizTitle">Paso ' + (S.step + 1) + " de " + total + ": " + esc(st.title) + '</h3><p class="why-step">' + esc(st.why) + "</p>" + st.qs.map(qHTML).join("") +
        '<div class="wiz-nav">' + (S.step > 0 ? '<button class="btn btn-ghost" type="button" id="wizBack">‹ Paso anterior</button>' : "<span></span>") + '<button class="btn btn-primary" type="button" id="wizNext">Siguiente paso ›</button></div>';
      st.qs.forEach(bindQ);
    } else {
      card.innerHTML = head + '<h3 tabindex="-1" id="wizTitle">Paso ' + total + " de " + total + ': Revisa tus respuestas</h3><p class="why-step">Confirma que todo esté bien antes de generar la evaluación. Puedes volver atrás para cambiar algo.</p><dl class="review">' +
        STEPS.map(function (s) { return s.qs.map(function (q) { var v = ans(q.id); var t = Array.isArray(v) ? (v.length ? v.map(function (x) { return optLabel(q.id, x); }).join(", ") : "Sin respuesta") : v ? (q.options ? optLabel(q.id, v) : v) : "Sin respuesta"; return "<div><dt>" + esc(q.label) + "</dt><dd>" + esc(t) + "</dd></div>"; }).join(""); }).join("") +
        '</dl><p class="privacy-note">' + ICON.lock + "<span>Tus respuestas se usan para calcular la evaluación en este navegador. En la plataforma se guardarán en tu cuenta empresarial y solo las verán personas con permiso.</span></p>" +
        '<div class="wiz-nav"><button class="btn btn-ghost" type="button" id="wizBack">‹ Cambiar respuestas</button><button class="btn btn-primary" type="button" id="wizGen">Generar evaluación</button></div>';
      $("#wizGen").addEventListener("click", generate);
    }
    var back = $("#wizBack"); if (back) back.addEventListener("click", function () { S.step--; renderWizard(); focusTitle(); });
    var next = $("#wizNext"); if (next) next.addEventListener("click", function () { if (validate(STEPS[S.step])) { S.step++; renderWizard(); focusTitle(); } });
  }
  function focusTitle() { var t = $("#wizTitle"); if (t) t.focus(); $("#jvBody").scrollTop = 0; }
  function qHTML(q) {
    var hint = q.hint ? '<span class="hint" id="h-' + q.id + '">' + q.hint + "</span>" : "", err = '<span class="err" id="e-' + q.id + '" aria-live="polite"></span>', v = ans(q.id), desc = 'aria-describedby="' + (q.hint ? "h-" + q.id + " " : "") + "e-" + q.id + '"';
    if (q.type === "text") return '<div class="q"><label class="ql" for="q-' + q.id + '">' + esc(q.label) + (q.required ? "" : " (opcional)") + "</label>" + hint + '<input type="text" id="q-' + q.id + '" ' + desc + ' value="' + esc(v || "") + '" placeholder="' + esc(q.ph || "") + '" maxlength="80">' + err + "</div>";
    if (q.type === "select") return '<div class="q"><label class="ql" for="q-' + q.id + '">' + esc(q.label) + "</label>" + hint + '<select id="q-' + q.id + '" ' + desc + '><option value="">Elige una opción</option>' + q.options.map(function (o) { return "<option" + (v === o ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select>" + err + "</div>";
    var multi = q.type === "check";
    return '<fieldset class="q" ' + desc + "><legend>" + esc(q.label) + (multi ? "" : "") + "</legend>" + hint + '<div class="opts">' + q.options.map(function (o) {
      var on = multi ? (v || []).indexOf(o[0]) > -1 : v === o[0];
      return '<label class="opt-c"><input type="' + (multi ? "checkbox" : "radio") + '" name="q-' + q.id + '" value="' + o[0] + '"' + (on ? " checked" : "") + "> <span>" + esc(o[1]) + "</span></label>";
    }).join("") + "</div>" + err + "</fieldset>";
  }
  function bindQ(q) {
    var save = function () { store("jv-draft", S.answers); };
    if (q.type === "text" || q.type === "select") { var el = $("#q-" + q.id); el.addEventListener(q.type === "text" ? "input" : "change", function () { S.answers[q.id] = el.value.trim(); clearErr(q.id); save(); }); return; }
    $$('input[name="q-' + q.id + '"]').forEach(function (inp) {
      inp.addEventListener("change", function () {
        if (q.type === "radio") S.answers[q.id] = inp.value;
        else {
          var excl = ["ninguna", "ninguno", "nose"], sel = $$('input[name="q-' + q.id + '"]:checked').map(function (x) { return x.value; });
          if (inp.checked && excl.indexOf(inp.value) > -1) { sel = [inp.value]; $$('input[name="q-' + q.id + '"]').forEach(function (x) { x.checked = x.value === inp.value; }); }
          else if (inp.checked) { sel = sel.filter(function (x) { return excl.indexOf(x) === -1; }); $$('input[name="q-' + q.id + '"]').forEach(function (x) { if (excl.indexOf(x.value) > -1) x.checked = false; }); }
          S.answers[q.id] = sel;
        }
        clearErr(q.id); save();
      });
    });
  }
  function clearErr(id) { var e = $("#e-" + id); if (e) e.textContent = ""; }
  function validate(st) {
    var first = null;
    st.qs.forEach(function (q) {
      var v = ans(q.id), empty = Array.isArray(v) ? !v.length : !v;
      if (q.required && empty) { $("#e-" + q.id).textContent = q.type === "text" ? "Escribe " + q.label.toLowerCase() + "." : "Elige una opción para continuar."; if (!first) first = q; }
    });
    if (first) { var f = $("#q-" + first.id) || $('input[name="q-' + first.id + '"]'); if (f) f.focus(); announce("Falta responder algunas preguntas."); return false; }
    return true;
  }
  function generate() {
    var btn = $("#wizGen"); btn.disabled = true; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Analizando respuestas…';
    showTab("chat"); setMascot("analyzing", "Analizando tu evaluación…", true); showTab("eval");
    setTimeout(function () {
      S.report = evaluate(S.answers); store("jv-report", S.report);
      addLog("Evaluación generada para " + S.report.empresa + " (" + S.report.score + "/100).");
      S.step = 0; S.turns = [];
      setMascot(restState(), "Evaluación lista", false); renderCtx(); renderSugg(); greet();
      showTab("rep"); announce("Evaluación lista: " + S.report.score + " de 100, " + S.report.level + ".");
      var h = $("#repTitle"); if (h) h.focus();
    }, calm() ? 50 : 900);
  }

  /* =====================================================================
     5. INFORME
     ===================================================================== */
  function renderReport() {
    var w = $("#repWrap"), r = S.report;
    if (!r) { w.innerHTML = '<div class="rep-empty">' + M.avatar("explaining") + '<h2 class="jv-h">Aún no hay informe</h2><p class="jv-sub">Responde la evaluación y aquí aparecerá tu informe con riesgos, prioridades y recomendaciones.</p><button class="btn btn-primary" type="button" id="repGo">Empezar la evaluación</button></div>'; $("#repGo").addEventListener("click", function () { showTab("eval", true); }); return; }
    var tech = S.level === "tecnico";
    var maxC = Math.max.apply(null, SEV.map(function (s) { return r.counts[s]; }).concat([1]));
    w.innerHTML =
      '<div class="rep-head"><div><h2 class="jv-h" tabindex="-1" id="repTitle">Informe de seguridad · ' + esc(r.empresa) + '</h2><p class="jv-sub">' + esc(r.sector) + " · " + esc(r.empleados) + " personas · " + new Date(r.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) + '</p></div>' +
      '<div class="rep-actions"><button class="btn btn-primary" type="button" id="repPdf">Descargar informe en PDF</button><button class="btn btn-ghost" type="button" id="repAsk">Preguntarle a JARVIS</button><button class="btn btn-ghost" type="button" id="repRedo">Hacer otra evaluación</button></div></div>' +
      '<div class="disclaimer">' + ICON.warn + '<div><b>Evaluación basada en tus respuestas.</b> Muestra posibles riesgos y recomendaciones preventivas; no confirma vulnerabilidades técnicas. <b>Vulnerabilidades confirmadas: ninguna</b>, porque todavía no se ha hecho un escaneo autorizado.</div></div>' +
      '<div class="rep-grid">' +
        '<section class="rcard r-sum" aria-labelledby="s1"><div class="jv-mini">' + M.avatar(restState()) + '</div><div><h3 id="s1">1. Resumen general</h3><div class="r-score">' + r.score + '<span style="font-size:1rem;color:var(--mist)"> / 100</span></div><div class="r-level">' + esc(r.level) + '</div><div class="jv-sev">' + sevChips(r.counts) + '</div></div></section>' +
        '<section class="rcard r-chart" aria-labelledby="s1b"><h3 id="s1b">Hallazgos por gravedad</h3><div class="bars">' + SEV.map(function (s) { return '<div class="bar sev-' + slug(s) + '"><span style="color:var(--frost)">' + s + '</span><div class="t" aria-hidden="true"><i data-w="' + (r.counts[s] / maxC * 100) + '"></i></div><output>' + r.counts[s] + '</output></div>'; }).join("") + '</div></section>' +
        '<section class="rcard r-assets" aria-labelledby="s2"><h3 id="s2">2. Activos evaluados (según tus respuestas)</h3><div class="assets">' + r.assets.map(function (x) { return '<span class="asset"><b>' + esc(x[0]) + ":</b>" + esc(x[1]) + "</span>"; }).join("") + "</div></section>" +
      "</div>" +
      '<h3 class="jv-h" style="font-size:1.25rem;margin-top:2rem">3. Hallazgos y recomendaciones</h3>' +
      '<p class="jv-sub">Ordenados por prioridad. Abre cada uno para ver qué significa, qué podría pasar y cómo solucionarlo.</p>' +
      '<div class="find-list">' + r.findings.map(function (f, i) {
        return '<article class="finding sev-' + slug(f.sev) + (i === 0 ? " open" : "") + '"><button type="button" aria-expanded="' + (i === 0) + '" aria-controls="fb-' + f.id + '"><span class="prio" aria-label="Prioridad ' + f.prio + '">' + String(f.prio).padStart(2, "0") + '</span><span><h4>' + esc(f.title) + '</h4><span class="meta"><span class="sev sev-' + slug(f.sev) + '">' + f.sev + '</span><span class="ftype">' + (f.type === "riesgo" ? "Posible riesgo según tus respuestas" : "Recomendación preventiva") + "</span></span></span>" + ICON.chev + "</button>" +
          '<div class="fbody" id="fb-' + f.id + '"><div><dl>' +
          "<div><dt>Qué significa</dt><dd>" + esc(f.desc) + "</dd></div>" +
          "<div><dt>Evidencia</dt><dd>" + esc(f.ev) + "</dd></div>" +
          "<div><dt>Qué podría pasar</dt><dd>" + esc(f.cons) + "</dd></div>" +
          "<div><dt>Cómo solucionarlo</dt><dd>" + esc(f.rec) + "</dd></div>" +
          (tech ? '<div><dt>Detalle técnico</dt><dd class="tech">' + esc(f.tech) + "</dd></div>" : "") +
          '</dl><button class="btn btn-ghost btn-sm ask" type="button" data-ask="' + esc(f.title) + '">Pedirle a JARVIS que me lo explique</button></div></div></article>';
      }).join("") + "</div>" +
      '<section class="rcard r-concl" aria-labelledby="s10"><h3 id="s10">Conclusiones</h3>' + r.concl.map(function (c) { return "<p>" + esc(c) + "</p>"; }).join("") +
        '<button class="btn btn-ghost btn-sm" type="button" id="repAI" style="margin-top:.6rem">Pedir a JARVIS un resumen ejecutivo</button><div class="ai-sum" id="aiSum" aria-live="polite"' + (r.aiSummary ? "" : " hidden") + '><div class="lab">Resumen de JARVIS (IA)</div><div id="aiSumTxt">' + (r.aiSummary ? md(r.aiSummary) : "") + "</div></div></section>";
    requestAnimationFrame(function () { $$(".bar i", w).forEach(function (i) { i.style.width = i.getAttribute("data-w") + "%"; }); });
    $$(".finding>button", w).forEach(function (b) { b.addEventListener("click", function () { var open = b.getAttribute("aria-expanded") !== "true"; b.setAttribute("aria-expanded", open); b.parentNode.classList.toggle("open", open); }); });
    $$("[data-ask]", w).forEach(function (b) { b.addEventListener("click", function () { showTab("chat"); send("Explícame este hallazgo y cómo solucionarlo paso a paso: " + b.getAttribute("data-ask")); }); });
    $("#repAsk").addEventListener("click", function () { showTab("chat"); $("#jvText").focus(); });
    $("#repRedo").addEventListener("click", function () { S.step = 0; showTab("eval", true); });
    $("#repPdf").addEventListener("click", exportPDF);
    $("#repAI").addEventListener("click", aiSummary);
  }
  function aiSummary() {
    var b = $("#repAI"), box = $("#aiSum"), txt = $("#aiSumTxt");
    if (!S.sample) { initAI(); if (!S.sample) { box.hidden = false; txt.innerHTML = "<p>La IA no está disponible en esta vista. El informe y el PDF funcionan igual.</p>"; return; } }
    b.disabled = true; box.hidden = false; txt.innerHTML = '<span class="typing"><i></i><i></i><i></i> JARVIS está leyendo el informe…</span>';
    S.sample([{ role: "user", content: rules() + "\n\nTarea: escribe un resumen ejecutivo del informe en 4 a 6 frases para la gerencia: estado general, los tres riesgos más importantes y el primer paso concreto. Recuerda que es una evaluación basada en respuestas." }], { cache: false, onText: function (u) { txt.innerHTML = md(u.text); } })
      .then(function (r) { S.report.aiSummary = r.text; store("jv-report", S.report); addLog("JARVIS generó un resumen ejecutivo."); })
      .catch(function (e) { txt.innerHTML = "<p>No pude generar el resumen" + (e && e.code === "not_granted" ? " porque la IA no tiene permiso en esta vista" : "") + ". El informe completo sigue disponible.</p>"; })
      .then(function () { b.disabled = false; });
  }

  /* =====================================================================
     6. PDF (generador propio, sin dependencias externas)
     ===================================================================== */
  var WIN = { "€": 128, "‚": 130, "„": 132, "…": 133, "‘": 145, "’": 146, "“": 147, "”": 148, "•": 149, "–": 150, "—": 151, "≥": 62 };
  function winAnsi(s) { var o = ""; for (var i = 0; i < s.length; i++) { var c = s[i], k = c.charCodeAt(0); if (k < 128 || (k >= 160 && k <= 255)) o += c; else if (WIN[c]) o += String.fromCharCode(WIN[c]); else if (c === "✓") o += "v"; else o += "?"; } return o; }
  function pdfStr(s) { return "(" + winAnsi(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)") + ")"; }
  function buildPDF(r) {
    var W = 595, H = 842, ML = 50, MR = 50, y, pages = [], ops = "";
    function newPage() { if (ops) pages.push(ops); ops = ""; y = H - 56; }
    function color(h) { var n = parseInt(h.slice(1), 16); return ((n >> 16) / 255).toFixed(3) + " " + ((n >> 8 & 255) / 255).toFixed(3) + " " + ((n & 255) / 255).toFixed(3); }
    function wrap(t, size) { var max = (W - ML - MR) / (size * 0.5), words = String(t).split(/\s+/), lines = [], cur = ""; words.forEach(function (w) { if ((cur + " " + w).trim().length > max) { if (cur) lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }); if (cur) lines.push(cur); return lines; }
    function text(t, size, bold, col, indent) {
      wrap(t, size).forEach(function (ln) { if (y < 60) newPage(); ops += "BT /" + (bold ? "F2" : "F1") + " " + size + " Tf " + color(col || "#1b1a24") + " rg " + (ML + (indent || 0)) + " " + y + " Td " + pdfStr(ln) + " Tj ET\n"; y -= size * 1.45; });
    }
    function gap(n) { y -= n; }
    function rect(x, yy, w, h, col) { ops += color(col) + " rg " + x + " " + yy + " " + w + " " + h + " re f\n"; }
    var SC = { "Crítico": "#c62828", "Alto": "#d35400", "Medio": "#b8860b", "Bajo": "#1f6f9f", "Informativo": "#6b6880" };
    newPage();
    rect(0, H - 8, W, 8, "#8052ff");
    text("EduSecurity · JARVIS", 10, true, "#5a33e6"); gap(4);
    text("Informe de seguridad: " + r.empresa, 20, true); gap(2);
    text(r.sector + " · " + r.empleados + " personas · " + new Date(r.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }), 10, false, "#55536a"); gap(10);
    rect(ML, y - 30, W - ML - MR, 44, "#fff4dc");
    text("Evaluación basada en las respuestas del formulario. Muestra posibles riesgos y recomendaciones preventivas; no confirma vulnerabilidades técnicas.", 9.5, false, "#5c3d00", 10); gap(14);
    text("1. Resumen general", 13, true, "#5a33e6"); gap(2);
    text("Puntuación: " + r.score + " de 100 — " + r.level, 12, true);
    text("Hallazgos: " + SEV.map(function (s) { return r.counts[s] + " " + s.toLowerCase(); }).join(", ") + ".", 10.5); gap(8);
    text("2. Activos evaluados", 13, true, "#5a33e6"); gap(2);
    r.assets.forEach(function (a) { text("• " + a[0] + ": " + a[1], 10.5); }); gap(8);
    text("3. Vulnerabilidades detectadas", 13, true, "#5a33e6"); gap(2);
    text("Vulnerabilidades técnicas confirmadas: ninguna. Este informe no incluye un escaneo autorizado; no hay referencias CVE ni puntuaciones CVSS que reportar. A continuación, los posibles riesgos y recomendaciones según las respuestas.", 10.5); gap(8);
    text("4 a 9. Hallazgos, riesgo, evidencia, consecuencias, recomendaciones y prioridad", 13, true, "#5a33e6"); gap(4);
    r.findings.forEach(function (f) {
      if (y < 200) newPage();
      rect(ML, y - 4, 4, 16, SC[f.sev]);
      text("Prioridad " + f.prio + " · " + f.title, 11.5, true, "#1b1a24", 10);
      text("Nivel de riesgo: " + f.sev + " · " + (f.type === "riesgo" ? "Posible riesgo según respuestas" : "Recomendación preventiva"), 9.5, true, SC[f.sev], 10);
      text("Descripción: " + f.desc, 10, false, "#2d2a3b", 10);
      text("Evidencia: " + f.ev, 10, false, "#2d2a3b", 10);
      text("Posibles consecuencias: " + f.cons, 10, false, "#2d2a3b", 10);
      text("Recomendación: " + f.rec, 10, false, "#2d2a3b", 10);
      text("Detalle técnico: " + f.tech, 9.5, false, "#55536a", 10);
      gap(10);
    });
    if (y < 160) newPage();
    text("10. Conclusiones", 13, true, "#5a33e6"); gap(2);
    r.concl.forEach(function (c) { text(c, 10.5); gap(3); });
    if (r.aiSummary) { gap(6); text("Resumen ejecutivo de JARVIS (generado con IA)", 11, true); text(r.aiSummary.replace(/\*\*/g, "").replace(/^\s*[-•]\s+/gm, "• "), 10.5); }
    pages.push(ops);
    // ensamblar el PDF
    var objs = [], n = pages.length;
    objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    var kids = []; for (var i = 0; i < n; i++) kids.push((5 + i * 2) + " 0 R");
    objs[2] = "<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + n + " >>";
    objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    pages.forEach(function (p, i) {
      var foot = "BT /F1 8 Tf 0.42 0.41 0.5 rg " + ML + " 30 Td " + pdfStr("EduSecurity · Informe generado por JARVIS · Página " + (i + 1) + " de " + n) + " Tj ET\n";
      var content = p + foot;
      objs[5 + i * 2] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + W + " " + H + "] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " + (6 + i * 2) + " 0 R >>";
      objs[6 + i * 2] = "<< /Length " + content.length + " >>\nstream\n" + content + "endstream";
    });
    var out = "%PDF-1.4\n%âãÏÓ\n", offs = [];
    for (var k = 1; k < objs.length; k++) { offs[k] = out.length; out += k + " 0 obj\n" + objs[k] + "\nendobj\n"; }
    var xref = out.length;
    out += "xref\n0 " + objs.length + "\n0000000000 65535 f \n";
    for (k = 1; k < objs.length; k++) out += String(offs[k]).padStart(10, "0") + " 00000 n \n";
    out += "trailer\n<< /Size " + objs.length + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF";
    var bytes = new Uint8Array(out.length); for (k = 0; k < out.length; k++) bytes[k] = out.charCodeAt(k) & 255;
    return bytes;
  }
  function exportPDF() {
    var r = S.report; if (!r) return;
    var bytes = buildPDF(r), name = "Informe-JARVIS-" + (r.empresa || "empresa").replace(/[^\wáéíóúñÁÉÍÓÚÑ -]/g, "").trim().replace(/\s+/g, "-") + ".pdf";
    var blob = new Blob([bytes], { type: "application/pdf" });
    var done = function () { addLog("Informe descargado en PDF."); announce("Informe listo para descargar."); };
    var fallback = function () { var u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); done(); };
    if (window.claude && window.claude.use) {
      window.claude.use("downloads").then(function (d) {
        if (!d) return fallback();
        d.save({ filename: name, data: blob }).then(done).catch(function (e) { if (e && e.code === "declined") announce("Descarga cancelada."); else if (e && e.code === "unavailable") fallback(); else announce("No se pudo descargar el PDF."); });
      }).catch(fallback);
    } else fallback();
  }
  window.__jvBuildPDF = function () { return S.report ? buildPDF(S.report) : null; };

  /* =====================================================================
     7. ESCANEO: registro, alcance y verificación de propiedad
     ===================================================================== */
  var CHECKS = [
    ["Información pública del dominio", "Registros DNS, correo (SPF, DKIM, DMARC) y datos de registro."],
    ["Certificado SSL/TLS", "Vigencia, emisor, versiones de protocolo y cifrados."],
    ["Configuración de seguridad web", "Cabeceras HTTP (HSTS, CSP, X-Frame-Options) y redirección a HTTPS."],
    ["Servicios y puertos expuestos", "Lista corta de puertos comunes, con velocidad limitada."],
    ["Tecnologías y versiones visibles", "Servidor web, CMS y librerías que se anuncian públicamente."],
    ["Vulnerabilidades conocidas", "Cruce de versiones con bases CVE y puntuación CVSS, solo como posibles hasta confirmarse."]
  ];
  $("#svcList").innerHTML = CHECKS.map(function (c) { return "<li>" + ICON.scan + "<span>" + esc(c[0]) + "<small>" + esc(c[1]) + '</small></span><span class="st-pend">Requiere configuración</span></li>'; }).join("");
  function renderLog() {
    var ul = $("#jvLogList"); if (!ul) return;
    ul.innerHTML = S.log.length ? S.log.map(function (l) { var d = new Date(l.t); return "<li><time datetime=\"" + l.t + "\">" + d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) + "</time>" + esc(l.m) + "</li>"; }).join("") : "<li>Sin actividad todavía.</li>";
  }
  function isPrivate(ip) { var p = ip.split(".").map(Number); return p[0] === 10 || p[0] === 127 || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || (p[0] === 169 && p[1] === 254) || p[0] === 0 || p[0] >= 224; }
  $$('input[name="stype"]').forEach(function (r) { r.addEventListener("change", function () { $("#scanTarget").placeholder = r.value === "ip" ? "203.0.113.10" : "miempresa.com"; }); });
  $("#scanForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var type = $('input[name="stype"]:checked').value, t = $("#scanTarget").value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""), err = "", ok = true;
    if (!t) err = "Escribe el dominio o la dirección IP.";
    else if (/[*,\s]|\/\d+$/.test($("#scanTarget").value)) err = "Escribe un solo activo. No se aceptan rangos, listas ni comodines (*).";
    else if (type === "dominio" && !/^(?=.{1,253}$)([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,63}$/.test(t)) err = "Ese dominio no parece válido. Ejemplo: miempresa.com";
    else if (type === "ip" && !/^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(t)) err = "Esa dirección IP no parece válida. Ejemplo: 203.0.113.10";
    else if (type === "ip" && isPrivate(t)) err = "Es una dirección privada o reservada: no se puede revisar desde Internet.";
    $("#scanErr").textContent = err; $("#scanTarget").setAttribute("aria-invalid", err ? "true" : "false");
    var allAuth = ["auth1", "auth2", "auth3"].every(function (id) { return $("#" + id).checked; });
    $("#authErr").textContent = allAuth ? "" : "Debes confirmar las tres declaraciones de autorización.";
    if (err) { $("#scanTarget").focus(); ok = false; } else if (!allAuth) { $("#auth1").focus(); ok = false; }
    if (!ok) return;
    var arr = new Uint8Array(12); (window.crypto || window.msCrypto).getRandomValues(arr);
    var token = "edusecurity-verificacion=" + Array.prototype.map.call(arr, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    S.scans.unshift({ t: t, type: type, token: token, when: $("#scanWindow").value, fecha: new Date().toISOString(), estado: "pendiente_verificacion" }); store("jv-scans", S.scans);
    addLog("Activo registrado: " + t + " (pendiente de verificar propiedad). No se ejecutó ningún escaneo.");
    $("#scanResult").innerHTML = '<div class="rcard" style="background:var(--card-2);margin-top:1.2rem"><h3>Activo registrado: ' + esc(t) + '</h3>' +
      "<p class=\"jv-sub\" style=\"margin:0\">Para demostrar que es tuyo, agrega este registro TXT en el DNS de tu dominio" + (type === "ip" ? " o pide al proveedor que confirme la asignación de la IP" : "") + ":</p><div class=\"token\">" + esc(token) + '</div>' +
      '<p class="jv-sub" style="margin:0">Otra opción: publica ese texto en <code>https://' + esc(t) + '/.well-known/edusecurity.txt</code>.</p>' +
      '<button class="btn btn-ghost" type="button" disabled aria-describedby="vNote" style="margin-top:1rem">Verificar propiedad</button><p class="jv-note" id="vNote" style="padding:0;margin-top:.5rem">Disponible cuando el servicio de escaneo esté conectado. Hasta entonces no se revisa nada.</p></div>';
    announce("Activo registrado. Se generó un código de verificación. No se ejecutó ningún escaneo.");
  });

  /* ---------------- Arranque ---------------- */
  setMascot(restState(), "Listo para ayudarte", false);
  renderCtx(); renderSugg(); greet(); renderLog();
})();
