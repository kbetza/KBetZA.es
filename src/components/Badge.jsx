/* Badge de equipo:
   - Si tenemos su escudo local (id en TEAMS, p. ej. equipos españoles), lo mostramos.
   - Si no (clubes extranjeros de Champions), un círculo con iniciales del nombre real. */
import { TeamLogo } from './ui.jsx';
import { TEAMS, teamName } from '../lib/teams.js';

const STOP = new Set(['fc', 'cf', 'afc', 'sc', 'ac', 'cd', 'sk', 'sl', 'bk', 'rb', 'us', 'uc', 'ss', 'as', 'ca', 'vfb', 'vfl', 'de', 'of', 'the', 'und', 'do']);
const COLORS = ['#FFC940', '#58B6FF', '#9C7BFF', '#FF8FA3', '#8BEF4E', '#5EE6C0', '#F4A261', '#E0A36B'];

function shortCode(name) {
  const words = (name || '').replace(/[.\-]/g, ' ').split(/\s+/).filter(Boolean);
  const sig = words.find((w) => !STOP.has(w.toLowerCase())) || words[0] || '??';
  return sig.slice(0, 3).toUpperCase();
}
function colorFor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

function InitialsBadge({ name, size }) {
  const color = colorFor(name);
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface-2)', border: `1.5px solid ${color}`, color,
      fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: size * 0.32, letterSpacing: 0.3,
    }}>{shortCode(name)}</span>
  );
}

export function CompBadge({ comp, id, name, size = 34 }) {
  if (TEAMS[id]) return <TeamLogo id={id} size={size} />;
  return <InitialsBadge name={name} size={size} />;
}

// Etiqueta de equipo: en LaLiga usamos el nombre limpio por id; en Champions, el nombre real de la BD.
export function teamLabel(comp, id, name) {
  if (TEAMS[id]) return teamName(id, name);
  return name || '';
}
