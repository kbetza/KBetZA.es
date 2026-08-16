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

/* ---------------- FECHAS Y HORAS ----------------
   all_matches guarda `fecha` (date) y `hora` (time) del partido en UTC — así los
   sirve football-data.org y así los interpretan las vistas SQL, con
   `(fecha + hora) AT TIME ZONE 'UTC'`. Todo lo que se PINTA va en hora
   peninsular española, que en verano es UTC+2 y en invierno UTC+1.
   Por eso fmtFecha/fmtHora necesitan el par completo: convertir la hora puede
   cambiar el día. */
export const TZ = 'Europe/Madrid';

// Los partidos sin horario asignado se guardan con hora 00:00:00. No son partidos
// de madrugada: son "por determinar" (LaLiga publica los horarios semanas antes).
// Se dejan sin convertir para no inventarles las 02:00.
const horaPorDeterminar = (hora) => !hora || String(hora).startsWith('00:00');

// Instante real del saque inicial, a partir del par UTC de la BD.
export const kickoffDate = (fecha, hora) => new Date(`${fecha}T${hora || '00:00:00'}Z`);

const dfDia  = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, day: 'numeric', month: 'numeric' });
const dfHora = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dfISO  = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

// (fecha, hora) UTC -> "13/12" en hora española
export function fmtFecha(fecha, hora) {
  if (!fecha) return '-';
  const d = kickoffDate(fecha, hora);
  return isNaN(d.getTime()) ? String(fecha) : dfDia.format(d);
}

// (hora, fecha) UTC -> "21:00" en hora española. Sin horario asignado -> "—"
export function fmtHora(hora, fecha) {
  if (horaPorDeterminar(hora)) return '—';
  const d = kickoffDate(fecha, hora);
  return isNaN(d.getTime()) ? String(hora) : dfHora.format(d);
}

// Día natural español ("YYYY-MM-DD") de un partido: para agrupar por día sin que
// un partido nocturno caiga en el día anterior.
export function diaLocal(fecha, hora) {
  const d = kickoffDate(fecha, hora);
  return isNaN(d.getTime()) ? String(fecha) : dfISO.format(d);
}
