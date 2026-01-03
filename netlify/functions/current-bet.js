/**
 * Netlify Function: Current Bet
 * Obtiene la apuesta actual del jugador
 * ACTUALIZADO: Incluye IDs de equipos para mostrar logos
 * ACTUALIZADO: Ordena partidos por fecha y hora
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

    // Obtener partidos actuales para tener los IDs de equipos y fecha/hora
    const { matches } = await getCurrentMatchdayMatches();
    
    // Crear mapa de partidos por ID
    const matchesMap = {};
    if (matches && matches.length > 0) {
      matches.forEach(m => {
        matchesMap[m.id] = {
          homeTeamId: m.homeTeam.id,
          awayTeamId: m.awayTeam.id,
          result: m.result,
          status: m.status,
          fecha: m.fecha,
          hora: m.hora
        };
      });
    }

    // Extraer número de jornada
    const jornadaStr = predictions[0].jornada;
    const matchdayNum = parseInt(jornadaStr.replace('Regular season - ', ''), 10);

    // Construir array de bets con fecha y hora
    let bets = predictions.map(p => {
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
        correct: p.acierto !== null ? p.acierto : correct,
        fecha: matchInfo.fecha || null,
        hora: matchInfo.hora || null
      };
    });

    // Ordenar por fecha y hora (primero los partidos más tempranos)
    bets.sort((a, b) => {
      // Función auxiliar para convertir fecha a comparable
      const parseFecha = (fecha) => {
        if (!fecha) return '9999-99-99';
        // Si es formato D/M/YYYY o DD/MM/YYYY
        if (typeof fecha === 'string' && fecha.includes('/')) {
          const parts = fecha.split('/');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
          }
        }
        // Si es formato YYYY-MM-DD
        if (typeof fecha === 'string' && fecha.includes('-')) {
          return fecha.substring(0, 10);
        }
        return fecha;
      };

      // Función auxiliar para convertir hora a comparable
      const parseHora = (hora) => {
        if (!hora) return '99:99';
        if (typeof hora === 'string') {
          const match = hora.match(/(\d{1,2}):(\d{2})/);
          if (match) {
            return `${match[1].padStart(2, '0')}:${match[2]}`;
          }
        }
        return hora;
      };

      const fechaA = parseFecha(a.fecha);
      const fechaB = parseFecha(b.fecha);
      
      if (fechaA !== fechaB) {
        return fechaA.localeCompare(fechaB);
      }
      
      const horaA = parseHora(a.hora);
      const horaB = parseHora(b.hora);
      
      return horaA.localeCompare(horaB);
    });

    const response = {
      matchday: matchdayNum,
      timestamp: predictions[0].created_at,
      bets: bets
    };

    return { statusCode: 200, headers, body: JSON.stringify(response) };

  } catch (error) {
    console.error('[current-bet] Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}