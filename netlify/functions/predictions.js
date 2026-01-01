/**
 * Netlify Function: Predictions
 * Guarda apuestas en current_predictions
 * SIMPLIFICADO: Ya no usa bet_registry, verifica directamente en current_predictions
 */

import { supabase } from '../../lib/supabase.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const bets = JSON.parse(event.body || '[]');

    if (!Array.isArray(bets) || bets.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Datos inválidos' }) };
    }

    const jugador = bets[0].jugador;
    const jornadaNum = bets[0].jornada; // Viene como "17" del frontend
    const jornadaStr = `Regular season - ${jornadaNum}`;

    if (!jugador || !jornadaNum) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta jugador o jornada' }) };
    }

    const usernameNormalized = jugador.toLowerCase();

    // Verificar si ya existe en current_predictions
    const { data: existingPredictions, error: checkError } = await supabase
      .from('current_predictions')
      .select('id')
      .eq('username', usernameNormalized)
      .eq('jornada', jornadaStr)
      .limit(1);

    if (checkError) {
      console.error('[predictions] Error checking existing predictions:', checkError);
      throw new Error('Error verificando apuestas existentes');
    }

    if (existingPredictions && existingPredictions.length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Ya has enviado tu apuesta', alreadySubmitted: true })
      };
    }

    // Insertar las predicciones
    const rows = bets.map(bet => ({
      username: usernameNormalized,
      id_partido: parseInt(bet.idpartido, 10),
      jornada: jornadaStr,
      equipo_local: bet.equipo_Local,
      equipo_visitante: bet.equipo_Visitante,
      pronostico: bet.pronostico,
      cuota: parseFloat(String(bet.cuota).replace(',', '.'))
    }));

    const { error: insertError } = await supabase
      .from('current_predictions')
      .insert(rows);

    if (insertError) {
      console.error('[predictions] Error inserting predictions:', insertError);
      
      // Si es error de duplicado (constraint unique), ya apostó
      if (insertError.code === '23505') {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'Ya has enviado tu apuesta', alreadySubmitted: true })
        };
      }
      
      throw new Error('Error guardando predicciones: ' + insertError.message);
    }

    console.log(`[predictions] ✓ ${jugador} apostó en ${jornadaStr} (${rows.length} partidos)`);

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ success: true, message: 'Apuesta registrada correctamente' }) 
    };

  } catch (error) {
    console.error('[predictions] Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}