/* Equipos de LaLiga 2025-26 — id de football-data.org → nombre corto + escudo.
   Los nombres de la BD son largos ("Club Atlético de Madrid"); aquí usamos
   versiones limpias para la UI. El escudo es /assets/teams/{id}.png. */

export const TEAMS = {
  77:   { name: 'Athletic Club',    short: 'ATH' },
  78:   { name: 'Atlético Madrid',  short: 'ATM' },
  79:   { name: 'CA Osasuna',       short: 'OSA' },
  80:   { name: 'RCD Espanyol',     short: 'ESP' },
  81:   { name: 'FC Barcelona',     short: 'BAR' },
  82:   { name: 'Getafe CF',        short: 'GET' },
  86:   { name: 'Real Madrid',      short: 'RMA' },
  87:   { name: 'Rayo Vallecano',   short: 'RAY' },
  88:   { name: 'Levante UD',       short: 'LEV' },
  89:   { name: 'RCD Mallorca',     short: 'MLL' },
  90:   { name: 'Real Betis',       short: 'BET' },
  92:   { name: 'Real Sociedad',    short: 'RSO' },
  94:   { name: 'Villarreal CF',    short: 'VIL' },
  95:   { name: 'Valencia CF',      short: 'VAL' },
  263:  { name: 'Deportivo Alavés', short: 'ALA' },
  285:  { name: 'Elche CF',         short: 'ELC' },
  298:  { name: 'Girona FC',        short: 'GIR' },
  558:  { name: 'RC Celta',         short: 'CEL' },
  559:  { name: 'Sevilla FC',       short: 'SEV' },
  1048: { name: 'Real Oviedo',      short: 'OVI' },
  // Ascendidos 2026-27 (añadir su escudo en /assets/teams/{id}.png)
  84:   { name: 'Málaga CF',        short: 'MAL' },
  560:  { name: 'Deportivo',        short: 'DEP' },
  5335: { name: 'Racing',           short: 'RAC' },
};

export const teamLogo = (id) => `/assets/teams/${id}.png`;

// Nombre para mostrar: preferimos el limpio por id; si no, el que venga de la BD.
export const teamName = (id, fallback) => TEAMS[id]?.name || fallback || '';
