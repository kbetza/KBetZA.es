/**
 * Netlify Function: Check Bet
 * Verifica si un jugador ya apostó
 * SIMPLIFICADO: Verifica directamente en current_predictions (ya no usa bet_registry)
 */

import { supabase } from '../../lib/supabase.js';

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
    const { jugador, jornada } = event.queryStringParameters || {};

    if (!jugador || !jornada) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Faltan parámetros' }) };
    }

    // Convertir jornada a formato completo
    const jornadaStr = jornada.includes('Regular season') 
      ? jornada 
      : `Regular season - ${jornada}`;

    const usernameNormalized = jugador.toLowerCase();

    // Verificar directamente en current_predictions
    const { data, error } = await supabase
      .from('current_predictions')
      .select('id')
      .eq('username', usernameNormalized)
      .eq('jornada', jornadaStr)
      .limit(1);

    if (error) {
      console.error('[check-bet] Error checking predictions:', error);
      return { statusCode: 200, headers, body: JSON.stringify({ hasBet: false }) };
    }

    const hasBet = data && data.length > 0;

    return { statusCode: 200, headers, body: JSON.stringify({ hasBet }) };

  } catch (error) {
    console.error('[check-bet] Error:', error);
    return { statusCode: 200, headers, body: JSON.stringify({ hasBet: false }) };
  }
}