/**
 * Netlify Function: Current Bet
 * Obtiene la apuesta actual del jugador
 * ACTUALIZADO: Incluye IDs de equipos para mostrar logos
 */

import { getPlayerCurrentPredictions, getCurrentMatchdayMatches } from '../../lib/supabase.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { jugador } = event.queryStringParameters || {};

    if (!jugador) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta jugador' }) };
    }

    const predictions = await getPlayerCurrentPredictions(jugador);

    if (!predictions || predictions.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ matchday: null, bets: [] }) };
    }

    // Obtener partidos actuales para tener los IDs de equipos
    const { matches } = await getCurrentMatchdayMatches();
    
    // Crear mapa de partidos por ID
    const matchesMap = {};
    if (matches && matches.length > 0) {
      matches.forEach(m => {
        matchesMap[m.id] = {
          homeTeamId: m.homeTeam.id,
          awayTeamId: m.awayTeam.id,
          result: m.result,
          status: m.status
        };
      });
    }

    // Extraer número de jornada
    const jornadaStr = predictions[0].jornada;
    const matchdayNum = parseInt(jornadaStr.replace('Regular season - ', ''), 10);

    const response = {
      matchday: matchdayNum,
      timestamp: predictions[0].created_at,
      bets: predictions.map(p => {
        const matchInfo = matchesMap[p.id_partido] || {};
        const actualResult = p.resultado_real || matchInfo.result || null;
        
        // Determinar si acertó
        let correct = null;
        if (actualResult) {
          correct = p.pronostico === actualResult;
        }
        
        return {
          matchId: p.id_partido,
          homeTeam: p.equipo_local,
          awayTeam: p.equipo_visitante,
          homeTeamId: matchInfo.homeTeamId || null,
          awayTeamId: matchInfo.awayTeamId || null,
          prediction: p.pronostico,
          odds: parseFloat(p.cuota),
          actualResult: actualResult,
          correct: p.acierto !== null ? p.acierto : correct
        };
      })
    };

    return { statusCode: 200, headers, body: JSON.stringify(response) };

  } catch (error) {
    console.error('[current-bet] Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}