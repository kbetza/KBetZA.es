/**
 * Netlify Function: Standings Players
 * Lee de player_standings para temporada completa
 * Lee de points_by_matchday para filtros por jornada
 * 
 * Soporta filtros:
 * - season: Clasificación de toda la temporada (por defecto)
 * - current: Puntos de la jornada actual (current_predictions) o última jornada jugada
 * - second-half: Clasificación desde la jornada 20 hasta la última
 */

import { supabase, getPlayerStandings, getCurrentMatchdayMatches } from '../../lib/supabase.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { filter } = event.queryStringParameters || {};
    const filterType = filter || 'season';

    let result;
    let filterInfo = { type: filterType };

    switch (filterType) {
      case 'current':
        result = await getCurrentMatchdayStandings();
        filterInfo.description = result.description;
        filterInfo.matchday = result.matchday;
        break;

      case 'second-half':
        result = await getSecondHalfStandings();
        filterInfo.description = 'Partidos de Vuelta (J20+)';
        break;

      case 'season':
      default:
        result = await getSeasonStandings();
        filterInfo.description = 'Temporada 2024-25';
        break;
    }

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({
        filter: filterInfo,
        standings: result.standings || []
      })
    };

  } catch (error) {
    console.error('[standings-players] Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}

/**
 * Clasificación de toda la temporada (original)
 */
async function getSeasonStandings() {
  const standings = await getPlayerStandings();

  if (!standings || standings.length === 0) {
    return { standings: [] };
  }

  // Formatear para el frontend existente
  const formatted = standings.map(p => ({
    Posicion: p.posicion,
    Jugador: p.username,
    'Puntos ganados': parseFloat(p.puntos_totales) || 0,
    Aciertos: p.aciertos_totales || 0,
    'Apuestas realizadas': p.jornadas_jugadas || 0
  }));

  return { standings: formatted };
}

/**
 * Clasificación de la jornada actual o última jugada
 */
async function getCurrentMatchdayStandings() {
  // 1. Obtener la jornada actual
  const { matchday } = await getCurrentMatchdayMatches();
  
  if (!matchday) {
    return { standings: [], description: 'Sin jornada activa', matchday: null };
  }

  const currentJornada = `Regular season - ${matchday}`;

  // 2. Verificar si hay partidos jugados en la jornada actual
  const { data: currentMatches } = await supabase
    .from('current_matchday')
    .select('estado')
    .eq('jornada', currentJornada);

  // CORREGIDO: El estado en la BD es 'Match finished', no 'FINISHED'
  const hasFinishedMatches = currentMatches && currentMatches.some(m => m.estado === 'Match finished');

  let targetJornada = currentJornada;
  let description = `Jornada ${matchday}`;

  // 3. Si no hay partidos terminados en la jornada actual, usar la anterior
  if (!hasFinishedMatches && matchday > 1) {
    targetJornada = `Regular season - ${matchday - 1}`;
    description = `Jornada ${matchday - 1}`;
  }

  // 4. Obtener puntos de esa jornada
  const { data: pointsData, error } = await supabase
    .from('points_by_matchday')
    .select('*')
    .eq('jornada', targetJornada);

  if (error) {
    console.error('[standings-players] Error getting current matchday points:', error);
    return { standings: [], description, matchday };
  }

  if (!pointsData || pointsData.length === 0) {
    // Si no hay datos en points_by_matchday, intentar calcular desde current_predictions
    return await calculateFromCurrentPredictions(matchday, description);
  }

  // 5. Ordenar por puntos y formatear
  const sorted = pointsData.sort((a, b) => parseFloat(b.puntos) - parseFloat(a.puntos));

  const formatted = sorted.map((p, index) => ({
    Posicion: index + 1,
    Jugador: p.username,
    'Puntos ganados': parseFloat(p.puntos) || 0,
    Aciertos: p.aciertos || 0,
    'Apuestas realizadas': 1
  }));

  return { 
    standings: formatted, 
    description,
    matchday: parseInt(targetJornada.replace('Regular season - ', ''))
  };
}

/**
 * Calcular puntos desde current_predictions si no hay datos históricos
 */
async function calculateFromCurrentPredictions(matchday, description) {
  const { data: predictions, error } = await supabase
    .from('current_predictions')
    .select('*');

  if (error || !predictions || predictions.length === 0) {
    return { standings: [], description, matchday };
  }

  // Agrupar por jugador y calcular puntos
  const playerStats = {};

  for (const pred of predictions) {
    const username = pred.username;
    
    if (!playerStats[username]) {
      playerStats[username] = {
        username,
        aciertos: 0,
        sumaCuotas: 0,
        puntos: 0
      };
    }

    // Solo contar si el jugador acertó
    if (pred.acierto === true) {
      playerStats[username].aciertos++;
      playerStats[username].sumaCuotas += parseFloat(pred.cuota) || 0;
    }
  }

  // Calcular puntos: aciertos * suma_cuotas
  for (const username in playerStats) {
    const stats = playerStats[username];
    stats.puntos = stats.aciertos * stats.sumaCuotas;
  }

  // Ordenar y formatear
  const sorted = Object.values(playerStats).sort((a, b) => b.puntos - a.puntos);

  const formatted = sorted.map((p, index) => ({
    Posicion: index + 1,
    Jugador: p.username,
    'Puntos ganados': parseFloat(p.puntos.toFixed(2)) || 0,
    Aciertos: p.aciertos || 0,
    'Apuestas realizadas': 1
  }));

  return { standings: formatted, description, matchday };
}

/**
 * Clasificación de partidos de vuelta (jornada 20+)
 */
async function getSecondHalfStandings() {
  // Obtener todos los puntos por jornada
  const { data: allPoints, error } = await supabase
    .from('points_by_matchday')
    .select('*');

  if (error) {
    console.error('[standings-players] Error getting second half standings:', error);
    return { standings: [] };
  }

  if (!allPoints || allPoints.length === 0) {
    return { standings: [] };
  }

  // Filtrar solo jornadas >= 20
  const secondHalfPoints = allPoints.filter(p => {
    const jornadaNum = parseInt(p.jornada.replace('Regular season - ', ''), 10);
    return jornadaNum >= 20;
  });

  if (secondHalfPoints.length === 0) {
    return { standings: [] };
  }

  // Agrupar por jugador y sumar
  const playerTotals = {};

  for (const entry of secondHalfPoints) {
    const username = entry.username;
    
    if (!playerTotals[username]) {
      playerTotals[username] = {
        username,
        puntos: 0,
        aciertos: 0,
        jornadas: 0
      };
    }

    playerTotals[username].puntos += parseFloat(entry.puntos) || 0;
    playerTotals[username].aciertos += entry.aciertos || 0;
    playerTotals[username].jornadas++;
  }

  // Ordenar y formatear
  const sorted = Object.values(playerTotals).sort((a, b) => b.puntos - a.puntos);

  const formatted = sorted.map((p, index) => ({
    Posicion: index + 1,
    Jugador: p.username,
    'Puntos ganados': parseFloat(p.puntos.toFixed(2)) || 0,
    Aciertos: p.aciertos || 0,
    'Apuestas realizadas': p.jornadas || 0
  }));

  return { standings: formatted };
}