import { Informe, SEVERIDADES, Severidad } from '../modelos';

/**
 * Genera el informe en PDF sin librerías externas (Helvetica con codificación WinAnsi,
 * que incluye tildes y ñ). Devuelve los bytes listos para descargar.
 * Secciones: 1 resumen · 2 activos · 3 vulnerabilidades · 4–9 hallazgos (descripción, riesgo,
 * evidencia, consecuencias, recomendaciones, prioridad) · 10 conclusiones.
 */

const WIN: Record<string, number> = { '€': 128, '‚': 130, '„': 132, '…': 133, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151 };
const COLOR_SEV: Record<Severidad, string> = { Crítico: '#c62828', Alto: '#d35400', Medio: '#b8860b', Bajo: '#1f6f9f', Informativo: '#6b6880' };

function winAnsi(s: string): string {
  let o = '';
  for (const c of s) {
    const k = c.charCodeAt(0);
    if (k < 128 || (k >= 160 && k <= 255)) o += c;
    else if (WIN[c]) o += String.fromCharCode(WIN[c]);
    else if (c === '≥') o += '>=';
    else if (c === '✓') o += 'v';
    else o += '?';
  }
  return o;
}
function cadena(s: string): string {
  return '(' + winAnsi(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)') + ')';
}
function rgb(h: string): string {
  const n = parseInt(h.slice(1), 16);
  return `${((n >> 16) / 255).toFixed(3)} ${(((n >> 8) & 255) / 255).toFixed(3)} ${((n & 255) / 255).toFixed(3)}`;
}
function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function construirPdf(r: Informe): Uint8Array {
  const W = 595, H = 842, ML = 50, MR = 50;
  const paginas: string[] = [];
  let ops = '';
  let y = H - 56;

  const nuevaPagina = () => {
    if (ops) paginas.push(ops);
    ops = '';
    y = H - 56;
  };
  const partir = (t: string, tam: number): string[] => {
    const max = (W - ML - MR) / (tam * 0.5);
    const lineas: string[] = [];
    let actual = '';
    for (const p of String(t).split(/\s+/)) {
      if ((actual + ' ' + p).trim().length > max) {
        if (actual) lineas.push(actual);
        actual = p;
      } else actual = (actual + ' ' + p).trim();
    }
    if (actual) lineas.push(actual);
    return lineas;
  };
  const texto = (t: string, tam: number, negrita = false, color = '#1b1a24', sangria = 0) => {
    for (const ln of partir(t, tam)) {
      if (y < 60) nuevaPagina();
      ops += `BT /${negrita ? 'F2' : 'F1'} ${tam} Tf ${rgb(color)} rg ${ML + sangria} ${y} Td ${cadena(ln)} Tj ET\n`;
      y -= tam * 1.45;
    }
  };
  const espacio = (n: number) => { y -= n; };
  const rect = (x: number, yy: number, w: number, h: number, color: string) => {
    ops += `${rgb(color)} rg ${x} ${yy} ${w} ${h} re f\n`;
  };

  rect(0, H - 8, W, 8, '#8052ff');
  texto('EduSecurity · JARVIS', 10, true, '#5a33e6'); espacio(4);
  texto('Informe de seguridad: ' + r.empresa, 20, true); espacio(2);
  texto(`${r.sector} · ${r.empleados} personas · ${fechaLarga(r.fecha)}`, 10, false, '#55536a'); espacio(10);
  rect(ML, y - 30, W - ML - MR, 44, '#fff4dc');
  texto('Evaluación basada en las respuestas del formulario. Muestra posibles riesgos y recomendaciones preventivas; no confirma vulnerabilidades técnicas.', 9.5, false, '#5c3d00', 10);
  espacio(14);
  texto('1. Resumen general', 13, true, '#5a33e6'); espacio(2);
  texto(`Puntuación: ${r.puntuacion} de 100 — ${r.nivel}`, 12, true);
  texto('Hallazgos: ' + SEVERIDADES.map((s) => `${r.conteo[s]} ${s.toLowerCase()}`).join(', ') + '.', 10.5); espacio(8);
  texto('2. Activos evaluados', 13, true, '#5a33e6'); espacio(2);
  r.activos.forEach(([k, v]) => texto(`• ${k}: ${v}`, 10.5)); espacio(8);

  const confirmados = r.hallazgos.filter((h) => h.tipo === 'confirmado');
  texto('3. Vulnerabilidades detectadas', 13, true, '#5a33e6'); espacio(2);
  if (confirmados.length) {
    confirmados.forEach((h) => texto(`• ${h.titulo}${h.cve ? ` (${h.cve}${h.cvss != null ? `, CVSS ${h.cvss}` : ''})` : ''}`, 10.5));
  } else {
    texto('Vulnerabilidades técnicas confirmadas: ninguna. Este informe no incluye un escaneo autorizado; no hay referencias CVE ni puntuaciones CVSS que reportar. A continuación, los posibles riesgos y recomendaciones según las respuestas.', 10.5);
  }
  espacio(8);
  texto('4 a 9. Hallazgos, riesgo, evidencia, consecuencias, recomendaciones y prioridad', 13, true, '#5a33e6'); espacio(4);
  for (const h of r.hallazgos) {
    if (y < 200) nuevaPagina();
    rect(ML, y - 4, 4, 16, COLOR_SEV[h.severidad]);
    const tipo = h.tipo === 'confirmado' ? 'Vulnerabilidad confirmada' : h.tipo === 'riesgo' ? 'Posible riesgo según respuestas' : 'Recomendación preventiva';
    texto(`Prioridad ${h.prioridad} · ${h.titulo}`, 11.5, true, '#1b1a24', 10);
    texto(`Nivel de riesgo: ${h.severidad} · ${tipo}`, 9.5, true, COLOR_SEV[h.severidad], 10);
    texto('Descripción: ' + h.descripcion, 10, false, '#2d2a3b', 10);
    texto('Evidencia: ' + h.evidencia, 10, false, '#2d2a3b', 10);
    texto('Posibles consecuencias: ' + h.consecuencias, 10, false, '#2d2a3b', 10);
    texto('Recomendación: ' + h.recomendacion, 10, false, '#2d2a3b', 10);
    texto('Detalle técnico: ' + h.detalleTecnico, 9.5, false, '#55536a', 10);
    espacio(10);
  }
  if (y < 160) nuevaPagina();
  texto('10. Conclusiones', 13, true, '#5a33e6'); espacio(2);
  r.conclusiones.forEach((c) => { texto(c, 10.5); espacio(3); });
  if (r.resumenIA) {
    espacio(6);
    texto('Resumen ejecutivo de JARVIS (generado con IA)', 11, true);
    texto(r.resumenIA.replace(/\*\*/g, '').replace(/^\s*[-•]\s+/gm, '• '), 10.5);
  }
  paginas.push(ops);

  // Ensamblar el archivo PDF
  const n = paginas.length;
  const objs: string[] = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = `<< /Type /Pages /Kids [${paginas.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${n} >>`;
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  paginas.forEach((p, i) => {
    const pie = `BT /F1 8 Tf 0.42 0.41 0.5 rg ${ML} 30 Td ${cadena(`EduSecurity · Informe generado por JARVIS · Página ${i + 1} de ${n}`)} Tj ET\n`;
    const contenido = p + pie;
    objs[5 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`;
    objs[6 + i * 2] = `<< /Length ${contenido.length} >>\nstream\n${contenido}endstream`;
  });
  let out = '%PDF-1.4\n%âãÏÓ\n';
  const offs: number[] = [];
  for (let k = 1; k < objs.length; k++) {
    offs[k] = out.length;
    out += `${k} 0 obj\n${objs[k]}\nendobj\n`;
  }
  const xref = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let k = 1; k < objs.length; k++) out += String(offs[k]).padStart(10, '0') + ' 00000 n \n';
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const bytes = new Uint8Array(out.length);
  for (let k = 0; k < out.length; k++) bytes[k] = out.charCodeAt(k) & 255;
  return bytes;
}

/** Descarga el PDF en el navegador. */
export function descargarPdf(r: Informe): void {
  const nombre = 'Informe-JARVIS-' + (r.empresa || 'empresa').replace(/[^\wáéíóúñÁÉÍÓÚÑ -]/g, '').trim().replace(/\s+/g, '-') + '.pdf';
  const blob = new Blob([construirPdf(r) as BlobPart], { type: 'application/pdf' });
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 4000);
}
