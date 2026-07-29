// Formato español: coma decimal.
export const fmtPts = (n) => (Number(n) || 0).toFixed(2).replace('.', ',');
export const fmtOdd = (n) => (Number(n) || 0).toFixed(2).replace('.', ',');

// Número de jornada: extrae el entero final de "Regular season - 17" / "League phase - 6"
export const jornadaNum = (str) => {
  const m = String(str || '').match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : null;
};

// Metadatos por competición
export const COMP = {
  PD: { code: 'PD', name: 'LaLiga',    accent: 'green', prefix: 'Regular season - ' },
  CL: { code: 'CL', name: 'Champions', accent: 'blue',  prefix: 'League phase - ' },
};

export const jornadaLabel = (comp, n) => (COMP[comp]?.prefix || COMP.PD.prefix) + n;

// Nombre de ronda a partir de la jornada (texto): "Jornada 8" o "Octavos", "Final", etc.
const KO_SHORT = { Playoff: 'Playoff', Octavos: '8vos', Cuartos: '4tos', Semifinales: 'Semi', Final: 'Final' };
export function roundName(jornadaStr) {
  const m = String(jornadaStr || '').match(/(\d+)\s*$/);
  return m ? `Jornada ${m[1]}` : String(jornadaStr || '');
}
export function roundShort(jornadaStr) {
  const m = String(jornadaStr || '').match(/(\d+)\s*$/);
  return m ? `J${m[1]}` : (KO_SHORT[jornadaStr] || String(jornadaStr || '').slice(0, 4));
}
// Jornada dominante (texto) de un conjunto de partidos
export function dominantJornada(matches) {
  const c = {};
  (matches || []).forEach((m) => { c[m.jornada] = (c[m.jornada] || 0) + 1; });
  return Object.keys(c).sort((a, b) => c[b] - c[a])[0] || '';
}

// Fecha "YYYY-MM-DD" -> "13/12"
export function fmtFecha(fecha) {
  if (!fecha) return '-';
  const m = String(fecha).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${parseInt(m[3], 10)}/${parseInt(m[2], 10)}`;
  return String(fecha);
}

// Hora "HH:MM:SS" -> "HH:MM"
export function fmtHora(hora) {
  if (!hora) return '-';
  const m = String(hora).match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : String(hora);
}
