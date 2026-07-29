/* ============================================================
   API KBetZA — comunicación con Supabase (app ↔ DB directo)
   Modelo por FECHAS: la quiniela activa son los próximos partidos por jugar;
   cada partido se cierra a su hora. La jornada es solo unidad de puntos.
   `comp` = 'PD' (LaLiga) | 'CL' (Champions).
   ============================================================ */

import { supabase } from './supabase.js';
import { jornadaNum, roundName, dominantJornada } from './format.js';

/* ---------------- AUTH ---------------- */
export async function login(username, password) {
  const { data, error } = await supabase.rpc('login', { p_username: username, p_password: password });
  if (error) throw error;
  return data && data.length ? data[0] : null;
}

/* ---------------- RELOJ DE VALIDACIÓN ---------------- */
export async function getReferenceDate() {
  const { data, error } = await supabase.rpc('get_reference_date');
  if (error) throw error;
  return data; // ISO string | null (null = tiempo real)
}
export async function setReferenceDate(ts) {
  const { error } = await supabase.rpc('set_reference_date', { p_ts: ts });
  if (error) throw error;
}
export async function clearReferenceDate() {
  const { error } = await supabase.rpc('clear_reference_date');
  if (error) throw error;
}

// Puntos de control de validación (antes / en juego / después de cada jornada)
export async function getCheckpoints() {
  const { data, error } = await supabase.from('jornada_checkpoints').select('*');
  if (error) throw error;
  return (data || [])
    .map((r) => ({ ts: Date.parse(r.ts), comp: r.competition, jornada: r.jornada, phase: r.phase }))
    .sort((a, b) => a.ts - b.ts);
}

/* ---------------- QUINIELA ACTIVA (próximos partidos) ---------------- */
export async function getCurrentMatchday(comp = 'PD') {
  const { data, error } = await supabase
    .from('current_matchday')
    .select('*')
    .eq('competition', comp)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });
  if (error) throw error;
  const matches = data || [];
  const jornadas = [...new Set(matches.map((m) => jornadaNum(m.jornada)))].sort((a, b) => a - b);
  const mixed = jornadas.length > 1;
  const domStr = dominantJornada(matches);
  return { matches, jornadas, jornada: jornadas.length === 1 ? jornadas[0] : null, mixed, jornadaStr: domStr, label: mixed ? 'Próxima quiniela' : roundName(domStr) };
}

// Jornadas activas por competición (para el menú de Apostar) — una por hero
export async function getActiveJornadas() {
  const [pd, cl] = await Promise.all([getCurrentMatchday('PD'), getCurrentMatchday('CL')]);
  const ms = (m) => Date.parse(`${m.fecha}T${m.hora || '00:00:00'}Z`);
  const group = (md) => {
    const g = {};
    md.matches.forEach((m) => { (g[m.jornada] ||= []).push(m); });
    return Object.entries(g)
      .map(([jornada, arr]) => ({ jornada, label: roundName(jornada), count: arr.length, first: Math.min(...arr.map(ms)) }))
      .sort((a, b) => a.first - b.first);
  };
  return { PD: group(pd), CL: group(cl) };
}

// Calendario COMPLETO de la temporada: todas las jornadas agrupadas y ordenadas por fecha.
export async function getSeasonCalendar(comp = 'PD') {
  const { data, error } = await supabase
    .from('all_matches').select('*').eq('competition', comp)
    .order('fecha', { ascending: true }).order('hora', { ascending: true });
  if (error) throw error;
  const matches = data || [];
  const ms = (m) => Date.parse(`${m.fecha}T${m.hora || '00:00:00'}Z`);
  const groups = {};
  matches.forEach((m) => { (groups[m.jornada] ||= []).push(m); });
  return Object.entries(groups)
    .map(([jornada, arr]) => ({
      jornada, label: roundName(jornada), matches: arr,
      first: Math.min(...arr.map(ms)), last: Math.max(...arr.map(ms)),
    }))
    .sort((a, b) => a.first - b.first);
}

// Picks del usuario (mapa id_partido -> pronóstico) para una competición
export async function getMyPicks(username, comp = 'PD') {
  const { data, error } = await supabase
    .from('predictions')
    .select('id_partido,pronostico,cuota')
    .eq('username', username.toLowerCase())
    .eq('competition', comp);
  if (error) throw error;
  const map = {};
  (data || []).forEach((p) => { map[p.id_partido] = { pick: p.pronostico, odd: Number(p.cuota) }; });
  return map;
}

/* ---------------- ENVIAR / EDITAR QUINIELA (cierre por partido) ---------------- */
export async function submitBet(username, bets, comp = 'PD') {
  const { data, error } = await supabase.rpc('submit_predictions', {
    p_username: username.toLowerCase(),
    p_bets: bets,
    p_competition: comp,
  });
  if (error) throw error;
  return data; // { success, saved, locked }
}

/* ---------------- MI APUESTA (tarjeta en vivo de una jornada) ---------------- */
export async function getMyCurrentBet(username, comp = 'PD', jornada = null) {
  const { data, error } = await supabase
    .from('current_jornada_full').select('*').eq('competition', comp)
    .order('fecha', { ascending: true }).order('hora', { ascending: true });
  if (error) throw error;
  // una jornada concreta si se indica; si no, la primera del cluster
  const all = data || [];
  const target = jornada || (all[0] && all[0].jornada);
  const matches = all.filter((m) => m.jornada === target);
  if (!matches.length) return null;
  const picks = await getMyPicks(username, comp);
  const jornadas = [...new Set(matches.map((m) => jornadaNum(m.jornada)))].sort((a, b) => a - b);
  const bets = matches.map((m) => {
    const p = picks[m.id_partido];
    const pick = p ? p.pick : null;
    return {
      matchId: m.id_partido, homeId: m.id_local, awayId: m.id_visitante,
      home: m.equipo_local, away: m.equipo_visitante,
      jornada: jornadaNum(m.jornada), fecha: m.fecha, hora: m.hora,
      pick, odd: p ? p.odd : null,
      played: m.jugado, result: m.resultado,
      ok: m.jugado && pick ? pick === m.resultado : null,
    };
  });
  const picked = bets.filter((b) => b.pick).length;
  const resolved = bets.filter((b) => b.played).length;
  const hits = bets.filter((b) => b.ok === true).length;
  const points = hits * bets.filter((b) => b.ok === true).reduce((a, b) => a + (b.odd || 0), 0);
  return {
    jornada: jornadaNum(target), jornadaStr: target, label: roundName(target),
    bets, picked, resolved, hits, points, total: bets.length,
  };
}

/* ---------------- CLASIFICACIÓN JUGADORES ---------------- */
export async function getPlayerStandings(comp = 'PD') {
  const { data, error } = await supabase
    .from('player_standings').select('*').eq('competition', comp)
    .order('posicion', { ascending: true });
  if (error) throw error;
  return (data || []).map((p) => ({
    name: p.username, points: Number(p.puntos_totales) || 0,
    hits: p.aciertos_totales || 0, bets: p.jornadas_jugadas || 0,
  }));
}

// Clasificación GENERAL: suma de LaLiga + Champions por jugador
export async function getPlayerStandingsGeneral() {
  const [pd, cl] = await Promise.all([getPlayerStandings('PD'), getPlayerStandings('CL')]);
  const map = {};
  [...pd, ...cl].forEach((p) => {
    const e = (map[p.name] ||= { name: p.name, points: 0, hits: 0, bets: 0 });
    e.points += p.points; e.hits += p.hits; e.bets += p.bets;
  });
  return Object.values(map)
    .map((e) => ({ ...e, points: Math.round(e.points * 100) / 100 }))
    .sort((a, b) => b.points - a.points);
}

// Miembros de un grupo
export async function getGroupMembers(group) {
  const { data, error } = await supabase.from('v_user_groups').select('username').eq('grupo', group);
  if (error) throw error;
  return (data || []).map((r) => r.username);
}

// Clasificación de un grupo = la General filtrada a los miembros del grupo
export async function getGroupStandings(group) {
  const [general, members] = await Promise.all([getPlayerStandingsGeneral(), getGroupMembers(group)]);
  const set = new Set(members);
  return general.filter((p) => set.has(p.name));
}

export async function getPlayerStandingsLast(comp = 'PD') {
  const [pbm, lastJor] = await Promise.all([
    supabase.from('points_by_matchday').select('*').eq('competition', comp),
    supabase.rpc('last_scored_jornada', { p_comp: comp }),
  ]);
  if (pbm.error) throw pbm.error;
  const data = pbm.data || [];
  if (!data.length) return { jornada: null, jornadaStr: null, label: null, rows: [] };
  // Última jornada por orden CRONOLÓGICO (sirve para eliminatorias sin número: Playoff..Final).
  // Fallback al mayor número si la RPC no devuelve nada.
  let jornadaStr = lastJor && !lastJor.error ? lastJor.data : null;
  if (!jornadaStr) {
    const maxJ = Math.max(...data.map((r) => jornadaNum(r.jornada) || 0));
    const f = data.filter((r) => jornadaNum(r.jornada) === maxJ);
    jornadaStr = f.length ? f[0].jornada : null;
  }
  const rows = data
    .filter((r) => r.jornada === jornadaStr)
    .map((r) => ({ name: r.username, points: Number(r.puntos) || 0, hits: r.aciertos || 0, bets: 1 }))
    .sort((a, b) => b.points - a.points);
  return { jornada: jornadaNum(jornadaStr), jornadaStr, label: roundName(jornadaStr), rows };
}

/* ---------------- APUESTA DE OTRO USUARIO (jornada en juego / última) ----------------
   Solo se revelan los pronósticos de partidos YA COMENZADOS (regla en el servidor). */
export async function getUserBet(username, comp = 'PD', jornadaStr = null) {
  const { data, error } = await supabase.rpc('get_user_bet', {
    p_username: username.toLowerCase(), p_competition: comp, p_jornada: jornadaStr,
  });
  if (error) throw error;
  const rows = data || [];
  const bets = rows.map((m) => ({
    matchId: m.id_partido, homeId: m.id_local, awayId: m.id_visitante,
    home: m.equipo_local, away: m.equipo_visitante,
    fecha: m.fecha, hora: m.hora,
    played: m.jugado, result: m.resultado,
    pick: m.pick, odd: m.cuota != null ? Number(m.cuota) : null,
    ok: m.jugado && m.pick && m.resultado ? m.pick === m.resultado : null,
  }));
  const pending = bets.filter((b) => !b.played).length;          // partidos sin empezar (oculto)
  const live = bets.filter((b) => b.played && !b.result).length; // en juego, sin resultado aún
  const hits = bets.filter((b) => b.ok === true).length;
  const points = bets.filter((b) => b.ok === true).reduce((a, b) => a + (b.odd || 0), 0);
  return {
    name: username, jornadaStr, label: roundName(jornadaStr),
    bets, pending, live, hits, points,
    picked: bets.filter((b) => b.pick).length, total: bets.length,
  };
}

/* ---------------- CLASIFICACIÓN DE EQUIPOS ---------------- */
export async function getLeagueStandings(comp = 'PD') {
  const { data, error } = await supabase
    .from('league_standings').select('*').eq('competition', comp)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data || []).map((t) => ({
    pos: t.position, id: t.team_id, name: t.team_name,
    pj: t.pj, pg: t.pg, pe: t.pe, pp: t.pp, gf: t.gf, gc: t.gc, dg: t.dg, pts: t.pts,
  }));
}

/* ---------------- CHAMPIONS: cuadro de eliminatorias ---------------- */
export async function isClLeaguePhaseOver() {
  const { data, error } = await supabase.rpc('cl_league_phase_over');
  if (error) throw error;
  return data === true;
}
export async function getClBracket() {
  const { data, error } = await supabase.from('cl_bracket').select('*').order('fecha', { ascending: true }).order('hora', { ascending: true });
  if (error) throw error;
  return data || [];
}

/* ---------------- HISTORIAL DEL JUGADOR ---------------- */
export async function getHistory(username, comp = 'PD') {
  const u = username.toLowerCase();
  const [histRes, ptsAllRes, amRes] = await Promise.all([
    supabase.from('predictions_history').select('*').eq('username', u).eq('competition', comp),
    supabase.from('points_by_matchday').select('username,jornada,aciertos,puntos').eq('competition', comp),
    supabase.from('all_matches').select('id_partido,id_local,id_visitante').eq('competition', comp),
  ]);
  const hist = histRes.data || [];
  const ptsAll = ptsAllRes.data || [];
  const amMap = {};
  (amRes.data || []).forEach((m) => { amMap[m.id_partido] = m; });

  const rankByJornada = {};
  const byJor = {};
  ptsAll.forEach((r) => { (byJor[r.jornada] ||= []).push(r); });
  Object.entries(byJor).forEach(([j, rows]) => {
    rows.sort((a, b) => Number(b.puntos) - Number(a.puntos));
    const idx = rows.findIndex((r) => r.username === u);
    if (idx >= 0) rankByJornada[j] = idx + 1;
  });

  const groups = {};
  hist.forEach((b) => {
    const g = (groups[b.jornada] ||= { bets: [] });
    const m = amMap[b.id_partido] || {};
    g.bets.push({
      homeId: m.id_local ?? null, awayId: m.id_visitante ?? null,
      home: b.equipo_local, away: b.equipo_visitante,
      pick: b.pronostico, result: b.resultado_real, odd: Number(b.cuota), ok: b.acierto === true,
    });
  });

  const myPts = {};
  ptsAll.filter((r) => r.username === u).forEach((r) => { myPts[r.jornada] = r; });

  return Object.entries(groups)
    .map(([jornadaStr, g]) => {
      const p = myPts[jornadaStr] || {};
      return {
        jornada: jornadaNum(jornadaStr),
        hits: p.aciertos ?? g.bets.filter((b) => b.ok).length,
        total: g.bets.length,
        points: Number(p.puntos) || 0,
        rank: rankByJornada[jornadaStr] || null,
        bets: g.bets,
      };
    })
    .sort((a, b) => b.jornada - a.jornada);
}

/* ---------------- TABLÓN ---------------- */
export async function getMessages() {
  const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(200);
  if (error) throw error;
  return data || [];
}
export async function postMessage(username, text) {
  const { data, error } = await supabase.rpc('post_message', { p_username: username.toLowerCase(), p_text: text });
  if (error) throw error;
  return data;
}
