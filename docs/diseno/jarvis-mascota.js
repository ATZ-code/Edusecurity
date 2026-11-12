/* JARVIS · Identidad gráfica
   Cuatro propuestas originales de mascota y los estados de la propuesta "Guardián digital".
   Todo es SVG vectorial: escala sin perder calidad y pesa muy poco. */
(function (global) {
  "use strict";
  var uid = 0;
  function id(p) { uid++; return p + uid; }

  /* ---------- Propuesta 1: Robot futurista ("Byte") ---------- */
  function robot() {
    var g = id("rb");
    return '<svg viewBox="0 0 200 220" role="img" aria-label="Propuesta 1: robot futurista">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef0ff"/><stop offset="1" stop-color="#b9b2e8"/></linearGradient></defs>' +
      '<g class="jv-float">' +
      '<line x1="100" y1="22" x2="100" y2="44" stroke="#a98cff" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="18" r="8" fill="#ffb829"/>' +
      '<rect x="40" y="44" width="120" height="92" rx="40" fill="url(#' + g + ')" stroke="#2b2442" stroke-width="3"/>' +
      '<rect x="56" y="62" width="88" height="54" rx="27" fill="#14102a"/>' +
      '<rect class="jv-blink" x="74" y="78" width="14" height="22" rx="7" fill="#4fd1b5"/><rect class="jv-blink" x="112" y="78" width="14" height="22" rx="7" fill="#4fd1b5"/>' +
      '<circle cx="40" cy="92" r="9" fill="#8052ff"/><circle cx="160" cy="92" r="9" fill="#8052ff"/>' +
      '<rect x="66" y="142" width="68" height="44" rx="18" fill="url(#' + g + ')" stroke="#2b2442" stroke-width="3"/>' +
      '<circle cx="100" cy="164" r="9" fill="#8052ff"/><path d="m96 164 3 3 6-7" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' +
      '</g><ellipse cx="100" cy="206" rx="40" ry="6" fill="#8052ff" opacity=".25"/></svg>';
  }

  /* ---------- Propuesta 2: IA holográfica ("Prisma") ---------- */
  function holo() {
    var g = id("ho"), out = "", sd = 7;
    function r() { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }
    var cols = ["#a98cff", "#4fd1b5", "#8fd3ff", "#ec5cc4"];
    for (var i = 0; i < 80; i++) {
      var a = r() * 6.283, d = Math.sqrt(r()) * 62, x = 100 + Math.cos(a) * d, y = 98 + Math.sin(a) * d * 1.08, s = 3 + r() * 6, rot = r() * 6.28, c = cols[(r() * 4) | 0];
      var pts = [0, 1, 2].map(function (k) { return (x + Math.cos(rot + k * 2.094) * s).toFixed(1) + "," + (y + Math.sin(rot + k * 2.094) * s).toFixed(1); }).join(" ");
      out += '<polygon points="' + pts + '" fill="' + (r() < .3 ? c : "none") + '" stroke="' + c + '" stroke-opacity="' + (.4 + r() * .5).toFixed(2) + '" fill-opacity=".35"/>';
    }
    return '<svg viewBox="0 0 200 220" role="img" aria-label="Propuesta 2: inteligencia artificial holográfica">' +
      '<defs><radialGradient id="' + g + '"><stop offset="0" stop-color="#a98cff" stop-opacity=".55"/><stop offset="1" stop-color="#a98cff" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="100" cy="98" r="80" fill="url(#' + g + ')"/>' +
      '<g class="jv-float">' + out +
      '<ellipse class="jv-blink" cx="82" cy="96" rx="7" ry="10" fill="#fff"/><ellipse class="jv-blink" cx="118" cy="96" rx="7" ry="10" fill="#fff"/>' +
      '<path d="M88 122q12 8 24 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/></g>' +
      '<g opacity=".5" stroke="#8fd3ff"><line x1="40" y1="180" x2="160" y2="180"/><line x1="56" y1="190" x2="144" y2="190"/><line x1="72" y1="200" x2="128" y2="200"/></g>' +
      '<path d="M70 175 100 150l30 25" fill="#8fd3ff" opacity=".12"/></svg>';
  }

  /* ---------- Propuesta 3: Guardián digital ("Égida") — con estados ---------- */
  var THEME = {
    normal:   { rim: "#a98cff", eye: "#4fd1b5", glow: "rgba(128,82,255,.45)" },
    alert:    { rim: "#ffb829", eye: "#ffb829", glow: "rgba(255,184,41,.5)" },
    ok:       { rim: "#4fd1b5", eye: "#4fd1b5", glow: "rgba(79,209,181,.5)" }
  };
  function guardian(state, opts) {
    state = state || "idle"; opts = opts || {};
    var t = state === "alert" ? THEME.alert : state === "ok" ? THEME.ok : THEME.normal;
    var g1 = id("gb"), g2 = id("gs"), lbl = opts.label || ("JARVIS " + ({ idle: "", welcome: "saludando", thinking: "pensando", analyzing: "analizando", alert: "mostrando una alerta", ok: "indicando que todo está bien", explaining: "explicando" }[state] || ""));
    // ojos por estado
    var eyes;
    if (state === "welcome" || state === "ok") {
      eyes = '<path d="M68 104q10-12 20 0M112 104q10-12 20 0" fill="none" stroke="' + t.eye + '" stroke-width="6" stroke-linecap="round"/>';
    } else if (state === "thinking") {
      eyes = '<g class="jv-look"><rect x="82" y="88" width="13" height="18" rx="6.5" fill="' + t.eye + '"/><rect x="114" y="88" width="13" height="18" rx="6.5" fill="' + t.eye + '"/></g>';
    } else if (state === "analyzing") {
      eyes = '<rect x="70" y="98" width="20" height="7" rx="3.5" fill="' + t.eye + '"/><rect x="110" y="98" width="20" height="7" rx="3.5" fill="' + t.eye + '"/>' +
        '<rect class="jv-scan" x="58" y="82" width="4" height="40" rx="2" fill="' + t.eye + '" opacity=".8"/>';
    } else if (state === "alert") {
      eyes = '<circle cx="80" cy="100" r="9" fill="' + t.eye + '"/><circle cx="120" cy="100" r="9" fill="' + t.eye + '"/><path d="M68 84l20 6M132 84l-20 6" stroke="' + t.eye + '" stroke-width="4" stroke-linecap="round"/>';
    } else if (state === "explaining") {
      eyes = '<g class="jv-blink"><rect x="73" y="90" width="14" height="20" rx="7" fill="' + t.eye + '"/><rect x="113" y="90" width="14" height="20" rx="7" fill="' + t.eye + '"/></g><path d="M110 82l18-4" stroke="' + t.eye + '" stroke-width="4" stroke-linecap="round"/>';
    } else {
      eyes = '<g class="jv-blink"><rect x="73" y="90" width="14" height="20" rx="7" fill="' + t.eye + '"/><rect x="113" y="90" width="14" height="20" rx="7" fill="' + t.eye + '"/></g>';
    }
    var mouth = state === "alert" ? '<path d="M92 124h16" stroke="' + t.eye + '" stroke-width="4" stroke-linecap="round"/>' :
      state === "thinking" ? '<circle cx="104" cy="124" r="3" fill="' + t.eye + '"/>' :
      '<path d="M90 121q10 8 20 0" fill="none" stroke="' + t.eye + '" stroke-width="4" stroke-linecap="round"/>';
    // emblema del pecho
    var emblem = state === "alert" ? '<circle cx="100" cy="164" r="15" fill="#2a1a00" stroke="#ffb829" stroke-width="3"/><path d="M100 155v10M100 171v1" stroke="#ffb829" stroke-width="4" stroke-linecap="round"/>' :
      state === "ok" ? '<circle cx="100" cy="164" r="15" fill="#06231d" stroke="#4fd1b5" stroke-width="3"/><path d="m93 164 5 5 10-11" fill="none" stroke="#4fd1b5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' :
      state === "analyzing" ? '<circle cx="100" cy="164" r="15" fill="#120d24" stroke="#a98cff" stroke-width="3"/><g class="jv-radar"><path d="M100 164V151" stroke="#4fd1b5" stroke-width="3" stroke-linecap="round"/></g><circle cx="100" cy="164" r="7" fill="none" stroke="#a98cff" opacity=".6"/>' :
      '<circle cx="100" cy="164" r="15" fill="#120d24" stroke="#a98cff" stroke-width="3"/><rect x="93" y="162" width="14" height="10" rx="2" fill="#a98cff"/><path d="M95.5 162v-3.5a4.5 4.5 0 0 1 9 0V162" fill="none" stroke="#a98cff" stroke-width="2.5"/>';
    // manos
    var hands = state === "welcome" ? '<g class="jv-wave"><circle cx="176" cy="96" r="11" fill="url(#' + g1 + ')" stroke="' + t.rim + '" stroke-width="2"/></g><circle cx="26" cy="146" r="10" fill="url(#' + g1 + ')" stroke="' + t.rim + '" stroke-width="2"/>' :
      state === "explaining" ? '<circle cx="178" cy="128" r="10" fill="url(#' + g1 + ')" stroke="' + t.rim + '" stroke-width="2"/><path d="M190 120l8-8" stroke="' + t.rim + '" stroke-width="3" stroke-linecap="round"/><circle cx="26" cy="146" r="10" fill="url(#' + g1 + ')" stroke="' + t.rim + '" stroke-width="2"/>' :
      state === "thinking" ? '<circle cx="150" cy="150" r="10" fill="url(#' + g1 + ')" stroke="' + t.rim + '" stroke-width="2"/><circle cx="26" cy="146" r="10" fill="url(#' + g1 + ')" stroke="' + t.rim + '" stroke-width="2"/>' :
      '<circle cx="174" cy="146" r="10" fill="url(#' + g1 + ')" stroke="' + t.rim + '" stroke-width="2"/><circle cx="26" cy="146" r="10" fill="url(#' + g1 + ')" stroke="' + t.rim + '" stroke-width="2"/>';
    var extra = state === "thinking" ? '<g class="jv-dots" fill="' + t.rim + '"><circle cx="150" cy="40" r="4"/><circle cx="164" cy="30" r="5"/><circle cx="180" cy="18" r="6"/></g>' :
      state === "alert" ? '<g class="jv-pulse"><path d="M168 22l14 26h-28z" fill="#ffb829" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/><path d="M168 32v7M168 43v.5" stroke="#000" stroke-width="2.5" stroke-linecap="round"/></g>' :
      state === "ok" ? '<g class="jv-pulse" fill="#4fd1b5"><path d="M170 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M30 50l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity=".7"/></g>' :
      state === "explaining" ? '<g fill="none" stroke="' + t.rim + '" stroke-width="2.5" stroke-linecap="round" opacity=".9"><rect x="150" y="18" width="42" height="28" rx="8"/><path d="M158 28h26M158 36h16"/></g>' :
      state === "analyzing" ? '<g class="jv-ring" fill="none" stroke="#4fd1b5" stroke-width="2" opacity=".7"><circle cx="100" cy="112" r="96" stroke-dasharray="6 10"/></g>' : "";
    return '<svg viewBox="0 0 200 220" role="img" aria-label="' + lbl.trim() + '" class="jv-mascot jv-' + state + '">' +
      '<defs><linearGradient id="' + g1 + '" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#9d7bff"/><stop offset="1" stop-color="#3a1f9c"/></linearGradient>' +
      '<radialGradient id="' + g2 + '" cx=".5" cy=".55" r=".55"><stop offset="0" stop-color="' + t.glow + '"/><stop offset="1" stop-color="rgba(0,0,0,0)"/></radialGradient></defs>' +
      '<circle cx="100" cy="112" r="98" fill="url(#' + g2 + ')"/>' + extra +
      '<g class="jv-float">' +
      '<ellipse class="jv-halo" cx="100" cy="34" rx="46" ry="9" fill="none" stroke="' + t.rim + '" stroke-width="3" stroke-dasharray="14 8" opacity=".9"/>' +
      '<path d="M100 44 164 68v44c0 44-28 74-64 88-36-14-64-44-64-88V68Z" fill="url(#' + g1 + ')" stroke="' + t.rim + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M100 44 164 68 132 80Z" fill="#fff" opacity=".12"/><path d="M36 68 100 44 70 82Z" fill="#fff" opacity=".07"/>' +
      '<rect x="54" y="78" width="92" height="58" rx="29" fill="#0b0918" stroke="' + t.rim + '" stroke-width="2.5"/>' +
      eyes + mouth + emblem + hands + '</g>' +
      '<ellipse cx="100" cy="212" rx="40" ry="5" fill="' + t.rim + '" opacity=".25"/></svg>';
  }
  /* Icono pequeño: solo el escudo con su visor */
  function icon(state) {
    var t = state === "alert" ? THEME.alert : state === "ok" ? THEME.ok : THEME.normal, g = id("gi");
    return '<svg viewBox="30 38 140 166" aria-hidden="true" class="jv-icon">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#9d7bff"/><stop offset="1" stop-color="#3a1f9c"/></linearGradient></defs>' +
      '<path d="M100 44 164 68v44c0 44-28 74-64 88-36-14-64-44-64-88V68Z" fill="url(#' + g + ')" stroke="' + t.rim + '" stroke-width="5"/>' +
      '<rect x="54" y="78" width="92" height="58" rx="29" fill="#0b0918"/>' +
      '<rect x="73" y="92" width="16" height="22" rx="8" fill="' + t.eye + '"/><rect x="111" y="92" width="16" height="22" rx="8" fill="' + t.eye + '"/></svg>';
  }

  /* ---------- Propuesta 4: Minimalista ("Núcleo") ---------- */
  function minimal() {
    return '<svg viewBox="0 0 200 220" role="img" aria-label="Propuesta 4: asistente minimalista">' +
      '<g class="jv-float">' +
      '<ellipse class="jv-halo" cx="100" cy="104" rx="84" ry="26" fill="none" stroke="#a98cff" stroke-width="3" transform="rotate(-18 100 104)"/>' +
      '<circle cx="100" cy="104" r="56" fill="#ededf3"/>' +
      '<circle cx="100" cy="104" r="56" fill="none" stroke="#8052ff" stroke-width="6"/>' +
      '<g class="jv-blink"><circle cx="84" cy="100" r="7" fill="#14102a"/><circle cx="116" cy="100" r="7" fill="#14102a"/></g>' +
      '<path d="M88 120q12 7 24 0" fill="none" stroke="#14102a" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="178" cy="78" r="8" fill="#ffb829"/></g>' +
      '<ellipse cx="100" cy="200" rx="34" ry="5" fill="#8052ff" opacity=".25"/></svg>';
  }

  /* ---------- Prisma (elegida): IA holográfica con estados ----------
     Un rostro hecho de fragmentos de luz proyectados sobre una base.
     Cada estado cambia la paleta, la expresión y el gesto de los fragmentos. */
  var PAL = {
    normal: { c: ["#a98cff", "#4fd1b5", "#8fd3ff", "#ec5cc4"], glow: "#a98cff", face: "#ffffff", beam: "#8fd3ff" },
    alert:  { c: ["#ffb829", "#ff8a4c", "#ffd166", "#ff6b6b"], glow: "#ffb829", face: "#fff4dc", beam: "#ffd166" },
    ok:     { c: ["#4fd1b5", "#8fd3ff", "#7ee8c8", "#a98cff"], glow: "#4fd1b5", face: "#eafff8", beam: "#7ee8c8" }
  };
  function shards(n, cx, cy, rad, sMin, sMax, pal, seed, twinkle) {
    var sd = seed, out = "";
    function r() { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }
    for (var i = 0; i < n; i++) {
      var a = r() * 6.283, d = Math.sqrt(r()) * rad, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 1.08, s = sMin + r() * (sMax - sMin), rot = r() * 6.28, c = pal.c[(r() * 4) | 0], filled = r() < .32, op = (.4 + r() * .5).toFixed(2), tw = twinkle && r() < .35;
      var pts = [0, 1, 2].map(function (k) { return (x + Math.cos(rot + k * 2.094) * s).toFixed(1) + "," + (y + Math.sin(rot + k * 2.094) * s).toFixed(1); }).join(" ");
      out += '<polygon' + (tw ? ' class="jv-tw" style="animation-delay:' + (r() * 3).toFixed(2) + 's"' : "") + ' points="' + pts + '" fill="' + (filled ? c : "none") + '" stroke="' + c + '" stroke-opacity="' + op + '" fill-opacity=".35"/>';
    }
    return out;
  }
  function prisma(state, opts) {
    state = state || "idle"; opts = opts || {};
    var p = state === "alert" ? PAL.alert : state === "ok" ? PAL.ok : PAL.normal, f = p.face;
    var g = id("pg"), lbl = opts.label || ("JARVIS " + ({ idle: "", welcome: "saludando", thinking: "pensando", analyzing: "analizando", alert: "mostrando una alerta", ok: "indicando que todo está bien", explaining: "explicando" }[state] || ""));
    var eyes, mouth, extra = "";
    if (state === "welcome" || state === "ok") eyes = '<path d="M74 98q8-11 16 0M110 98q8-11 16 0" fill="none" stroke="' + f + '" stroke-width="5" stroke-linecap="round"/>';
    else if (state === "thinking") eyes = '<g class="jv-look"><ellipse cx="86" cy="90" rx="6" ry="9" fill="' + f + '"/><ellipse cx="122" cy="90" rx="6" ry="9" fill="' + f + '"/></g>';
    else if (state === "analyzing") eyes = '<rect x="72" y="93" width="20" height="6" rx="3" fill="' + f + '"/><rect x="108" y="93" width="20" height="6" rx="3" fill="' + f + '"/>';
    else if (state === "alert") eyes = '<circle cx="82" cy="96" r="8.5" fill="' + f + '"/><circle cx="118" cy="96" r="8.5" fill="' + f + '"/><path d="M70 80l18 6M130 80l-18 6" stroke="' + f + '" stroke-width="4" stroke-linecap="round"/>';
    else eyes = '<g class="jv-blink"><ellipse cx="82" cy="96" rx="7" ry="10" fill="' + f + '"/><ellipse cx="118" cy="96" rx="7" ry="10" fill="' + f + '"/></g>';
    mouth = state === "alert" ? '<path d="M90 122h20" stroke="' + f + '" stroke-width="3.5" stroke-linecap="round"/>' :
      state === "thinking" ? '<circle cx="106" cy="122" r="3" fill="' + f + '"/>' :
      state === "explaining" ? '<ellipse cx="100" cy="122" rx="7" ry="5" fill="none" stroke="' + f + '" stroke-width="3"/>' :
      state === "welcome" || state === "ok" ? '<path d="M86 118q14 12 28 0" fill="none" stroke="' + f + '" stroke-width="3.5" stroke-linecap="round"/>' :
      '<path d="M88 120q12 8 24 0" fill="none" stroke="' + f + '" stroke-width="3" stroke-linecap="round" opacity=".9"/>';
    if (state === "thinking") extra = '<g class="jv-dots" fill="' + p.c[0] + '"><circle cx="150" cy="38" r="4"/><circle cx="164" cy="28" r="5"/><circle cx="180" cy="16" r="6"/></g>';
    else if (state === "analyzing") extra = '<g class="jv-sweep"><rect x="36" y="34" width="128" height="3" rx="1.5" fill="' + p.beam + '" opacity=".9"/><rect x="36" y="37" width="128" height="16" fill="' + p.beam + '" opacity=".08"/></g>' +
      '<g class="jv-ring" fill="none" stroke="' + p.c[1] + '" stroke-width="2" opacity=".55"><circle cx="100" cy="98" r="84" stroke-dasharray="4 12" style="transform-origin:100px 98px"/></g>';
    else if (state === "alert") extra = '<g class="jv-pulse"><path d="M170 18l14 26h-28z" fill="#ffb829" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/><path d="M170 28v7M170 39v.5" stroke="#000" stroke-width="2.5" stroke-linecap="round"/></g>';
    else if (state === "ok") extra = '<g class="jv-pulse" fill="' + p.c[0] + '"><path d="M172 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M28 46l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity=".7"/></g>';
    else if (state === "explaining") extra = '<g fill="none" stroke="' + p.c[2] + '" stroke-width="2.5" stroke-linecap="round" opacity=".9"><rect x="148" y="14" width="44" height="30" rx="8" fill="' + p.c[2] + '" fill-opacity=".08"/><path d="M156 25h28M156 33h18"/></g><path d="M150 46l-12 14" stroke="' + p.c[2] + '" stroke-width="2" stroke-dasharray="3 4" opacity=".7"/>';
    else if (state === "welcome") extra = '<g class="jv-wave">' + shards(9, 170, 92, 12, 3, 6, p, 41, false) + "</g>";
    var cloud = shards(80, 100, 98, 62, 3, 9, p, 7, true);
    return '<svg viewBox="0 0 200 220" role="img" aria-label="' + lbl.trim() + '" class="jv-mascot jv-prisma jv-' + state + '">' +
      '<defs><radialGradient id="' + g + '"><stop offset="0" stop-color="' + p.glow + '" stop-opacity=".55"/><stop offset="1" stop-color="' + p.glow + '" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="100" cy="98" r="84" fill="url(#' + g + ')"/>' + extra +
      '<g class="jv-float"><g' + (state === "thinking" ? ' class="jv-orbit"' : "") + ">" + cloud + "</g>" + eyes + mouth + "</g>" +
      '<path d="M66 178 100 150l34 28" fill="' + p.beam + '" opacity=".12"/>' +
      '<g opacity=".55" stroke="' + p.beam + '" stroke-linecap="round"><line x1="40" y1="182" x2="160" y2="182"/><line x1="56" y1="192" x2="144" y2="192"/><line x1="72" y1="202" x2="128" y2="202"/></g></svg>';
  }
  /* Icono pequeño de Prisma: pocos fragmentos grandes para que se lea a 24 px */
  function prismaIcon(state) {
    var p = state === "alert" ? PAL.alert : state === "ok" ? PAL.ok : PAL.normal, g = id("pi");
    return '<svg viewBox="28 28 144 144" aria-hidden="true" class="jv-icon jv-prisma-icon">' +
      '<defs><radialGradient id="' + g + '"><stop offset="0" stop-color="' + p.glow + '" stop-opacity=".7"/><stop offset="1" stop-color="' + p.glow + '" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="100" cy="100" r="70" fill="url(#' + g + ')"/>' + shards(16, 100, 100, 56, 9, 16, p, 13, false) +
      '<ellipse cx="80" cy="98" rx="11" ry="15" fill="' + p.face + '"/><ellipse cx="120" cy="98" rx="11" ry="15" fill="' + p.face + '"/></svg>';
  }

  global.JarvisMascot = { robot: robot, holo: holo, guardian: guardian, icon: icon, minimal: minimal, prisma: prisma, prismaIcon: prismaIcon,
    avatar: prisma, avatarIcon: prismaIcon,
    STATES: ["welcome", "thinking", "analyzing", "alert", "ok", "explaining"] };
})(window);
