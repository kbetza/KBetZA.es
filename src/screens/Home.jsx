import { useEffect, useState, useCallback } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Wordmark, StatTile, BottomNav, Loading } from '../components/ui.jsx';
import { TablonPreview, TablonScreen } from '../components/Tablon.jsx';
import { getCurrentMatchday, getMyPicks, getPlayerStandings, getMessages, postMessage, getCheckpoints, getFantasyInterest, setFantasyInterest } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';
import { fmtPts, fmtFecha, fmtHora, roundName } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useClock } from '../context/ClockContext.jsx';

const SEEN_KEY = 'kbetza_tablon_seen';
const pad = (n) => String(n).padStart(2, '0');
const kickoffMs = (m) => Date.parse(`${m.fecha}T${m.hora || '00:00:00'}Z`);
// Eliminatorias de Champions, en orden, mapeadas a las fotos j9–j13
const KO_KEY = { Playoff: 'j9', Octavos: 'j10', Cuartos: 'j11', Semifinales: 'j12', Final: 'j13' };
const heroKey = (j) => {
  const m = String(j).match(/(\d+)\s*$/);
  if (m) return 'j' + m[1];
  return KO_KEY[j] || 'default';
};

/* ---------- Reloj de validación (navega por jornadas) ---------- */
const PHASE = { 'antes': 'antes del comienzo', 'en juego': 'en juego', 'despues': 'al terminar' };
function cpLabel(c) {
  if (!c) return null;
  const comp = c.comp === 'CL' ? 'Champions' : 'LaLiga';
  const m = String(c.jornada).match(/(\d+)\s*$/);
  const jn = m ? 'J' + m[1] : c.jornada;
  return `${comp} ${jn} · ${PHASE[c.phase] || c.phase}`;
}
function ClockBar() {
  const { refMs, isSim, applyRef } = useClock();
  const [cps, setCps] = useState([]);
  useEffect(() => { getCheckpoints().then(setCps).catch(console.error); }, []);

  const cur = isSim ? refMs : Date.now();
  const goISO = (ms) => applyRef(new Date(ms).toISOString());
  const prev = [...cps].reverse().find((c) => c.ts < cur - 90000);
  const next = cps.find((c) => c.ts > cur + 90000);
  const here = cps.find((c) => Math.abs(c.ts - cur) < 90000);
  const label = here ? cpLabel(here)
    : (isSim ? new Date(cur).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Tiempo real');
  const dateVal = new Date(cur).toISOString().slice(0, 10);

  return (
    <div style={{ marginBottom: 14, padding: '8px 10px', borderRadius: 12, background: 'var(--surface-2)', border: '1px dashed var(--line-2)', fontSize: 12 }}>
      <div className="kb-row" style={{ gap: 8 }}>
        <Icon name="clock" size={15} />
        <button onClick={() => prev && goISO(prev.ts)} disabled={!prev} style={{ ...btn, opacity: prev ? 1 : 0.4 }}>◀</button>
        <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, color: here ? 'var(--text)' : 'var(--muted)' }}>{label}</span>
        <button onClick={() => next && goISO(next.ts)} disabled={!next} style={{ ...btn, opacity: next ? 1 : 0.4 }}>▶</button>
      </div>
      <div className="kb-row" style={{ gap: 8, marginTop: 7 }}>
        <span style={{ color: 'var(--muted-2)', fontSize: 11 }}>Ir a fecha:</span>
        <input type="date" value={dateVal} onChange={(e) => e.target.value && goISO(Date.parse(e.target.value + 'T12:00:00Z'))}
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text)', padding: '3px 6px', fontSize: 12, colorScheme: 'dark' }} />
        {isSim && <button onClick={() => applyRef(null)} style={{ ...btn, marginLeft: 'auto', color: 'var(--green)' }}>Tiempo real</button>}
      </div>
    </div>
  );
}
const btn = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text)', padding: '3px 8px', cursor: 'pointer', fontSize: 12 };

/* ---------- Hero de UNA jornada ---------- */
function Hero({ comp, jornadaStr, matches, hasBet, onNav }) {
  const { now } = useClock();
  const blue = comp === 'CL';
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []);

  const first = matches[0];
  let d = Math.max(0, kickoffMs(first) - now());
  const days = Math.floor(d / 86400000); d -= days * 86400000;
  const h = Math.floor(d / 3600000); d -= h * 3600000;
  const mn = Math.floor(d / 60000); d -= mn * 60000;
  const sc = Math.floor(d / 1000);

  const title = roundName(jornadaStr);
  const bg = `/assets/heroes/${blue ? 'champions' : 'la_liga'}/${heroKey(jornadaStr)}.png`;
  const rgb = blue ? '8,17,32' : '11,20,16';
  const deadline = `${fmtFecha(first.fecha)} · ${fmtHora(first.hora)}`;
  const goBet = () => onNav(hasBet ? 'miapuesta' : 'apostar', { comp, jornada: jornadaStr });

  return (
    <div className={blue ? 'cl-scope' : undefined} style={{
      position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', padding: '20px 20px 22px', marginBottom: 16,
      background: blue ? '#0B1422' : '#0E1A12', border: `1px solid ${blue ? 'rgba(88,182,255,0.25)' : 'rgba(43,227,107,0.22)'}`,
    }}>
      <img src={bg} alt="" aria-hidden="true" onError={(e) => { e.currentTarget.style.display = 'none'; }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right 28%' }} />
      <span style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, rgb(${rgb}) 10%, rgba(${rgb},0.82) 42%, rgba(${rgb},0.32) 72%, rgba(${rgb},0.6) 100%)` }} />
      <span style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 26%, rgba(${rgb},0.55) 66%, rgb(${rgb}) 100%)` }} />
      <span style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.3, background: `linear-gradient(120deg, ${blue ? 'rgba(88,182,255,0.5)' : 'rgba(43,227,107,0.5)'}, transparent 60%)` }} />

      <div className="kb-between" style={{ position: 'relative', marginBottom: 14 }}>
        <span className={'kb-eyebrow' + (blue ? ' blue' : '')}>{title} · {blue ? 'Champions' : 'LaLiga'}</span>
        <span className={'kb-pill ' + (blue ? 'blue' : 'green')}><Icon name="bolt" size={13} stroke={2.2} /> {hasBet ? 'Enviada' : 'Abierta'}</span>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 8px' }}>Primer partido en</p>
        <div className="kb-row" style={{ gap: 8, alignItems: 'flex-end' }}>
          {[[days, 'días'], [h, 'horas'], [mn, 'min'], [sc, 'seg']].map(([v, l], i) => (
            <span key={l} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              {i > 0 && <span className="kb-num" style={{ fontSize: 30, color: 'var(--muted-2)', paddingBottom: 14 }}>:</span>}
              <span style={{ textAlign: 'center' }}>
                <span className="kb-num" style={{ display: 'block', fontSize: 40, lineHeight: 1, color: 'var(--text)' }}>{pad(v)}</span>
                <span style={{ display: 'block', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>{l}</span>
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="kb-row" style={{ position: 'relative', gap: 7, color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
        <Icon name="calendar" size={16} /> {matches.length} {matches.length === 1 ? 'partido' : 'partidos'} · desde {deadline}
      </div>

      <button className={'kb-btn' + (hasBet ? ' ghost' : (blue ? ' blue' : ''))} style={{ position: 'relative', zIndex: 1 }} onClick={goBet}>
        {hasBet ? <><Icon name="check" size={19} stroke={2.4} /> Ver mi apuesta</> : <><Icon name="ticket" size={19} stroke={2.1} /> Hacer mi quiniela</>}
      </button>
    </div>
  );
}

function buildHeroes(comp, matches, picks) {
  const groups = {};
  matches.forEach((m) => { (groups[m.jornada] ||= []).push(m); });
  return Object.entries(groups)
    .map(([jornadaStr, ms]) => {
      ms.sort((a, b) => kickoffMs(a) - kickoffMs(b));
      return { comp, jornadaStr, matches: ms, firstMs: kickoffMs(ms[0]), hasBet: ms.every((m) => picks[m.id_partido]) };
    })
    .sort((a, b) => a.firstMs - b.firstMs);
}

export function HomeScreen({ onNav }) {
  const { user, signOut } = useAuth();
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tablonOpen, setTablonOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => Number(localStorage.getItem(SEEN_KEY)) || 0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [pdMd, clMd, players, pdPicks, clPicks] = await Promise.all([
        getCurrentMatchday('PD'), getCurrentMatchday('CL'), getPlayerStandings('PD'),
        getMyPicks(user.username, 'PD'), getMyPicks(user.username, 'CL'),
      ]);
      if (alive) setData({ pdMd, clMd, players, pdPicks, clPicks });
    })().catch((e) => { console.error(e); if (alive) setData({ error: true }); });
    return () => { alive = false; };
  }, [user.username]);

  useEffect(() => {
    let alive = true;
    getMessages().then((m) => { if (alive) setMessages(m); }).catch(console.error);
    const channel = supabase.channel('tablon')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => prev.some((x) => x.id === payload.new.id) ? prev : [...prev, payload.new]);
      }).subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  }, []);

  const [fantasy, setFantasy] = useState(false);
  useEffect(() => { getFantasyInterest(user.username).then(setFantasy).catch(() => {}); }, [user.username]);
  const toggleFantasy = () => {
    const next = !fantasy;
    setFantasy(next);
    setFantasyInterest(user.username, next).catch(() => setFantasy(!next));
  };

  const unread = messages.filter((m) => m.username !== user.username && new Date(m.created_at).getTime() > lastSeen).length;
  const markSeen = useCallback(() => { const t = Date.now(); localStorage.setItem(SEEN_KEY, String(t)); setLastSeen(t); }, []);
  const openTablon = () => { markSeen(); setTablonOpen(true); };
  const closeTablon = () => { markSeen(); setTablonOpen(false); };
  const sendMessage = async (text) => {
    const row = await postMessage(user.username, text);
    if (row) setMessages((prev) => prev.some((x) => x.id === row.id) ? prev : [...prev, row]);
  };

  if (!data) return <div className="kb-app"><Loading label="Cargando KBetZA…" /><BottomNav active="inicio" onNav={onNav} /></div>;

  const heroes = [
    ...buildHeroes('PD', data.pdMd.matches, data.pdPicks),
    ...buildHeroes('CL', data.clMd.matches, data.clPicks),
  ];

  const players = (data.players || []).slice().sort((a, b) => b.points - a.points);
  const myIdx = players.findIndex((p) => p.name === user.username);
  const me = myIdx >= 0 ? players[myIdx] : { name: user.username, points: 0, hits: 0 };
  const myRank = myIdx >= 0 ? myIdx + 1 : players.length + 1;
  const above = myRank > 1 ? players[myRank - 2] : null;
  const below = myRank < players.length ? players[myRank] : null;
  const gapAbove = above ? above.points - me.points : 0;
  const gapBelow = below ? me.points - below.points : 0;

  const banner = (() => {
    const b = (g) => <b className="kb-num" style={{ fontSize: 15 }}>{fmtPts(g)}</b>;
    if (myRank === 1 && below) return { icon: 'crown', tone: 'gold', jsx: <>¡Eres el <b>líder</b> de KBetZA! Sacas <span className="kb-gold">{b(gapBelow)}</span> pts a <b>{below.name}</b>.</> };
    if (!above) return { icon: 'bolt', tone: 'green', jsx: <>Aún sin datos. ¡Haz tu primera quiniela!</> };
    if (gapAbove <= 2) return { icon: 'flame', tone: 'red', jsx: <>¡Lo tienes a tiro! A solo <span className="kb-red">{b(gapAbove)}</span> pts de <b>{above.name}</b>.</> };
    if (gapAbove <= 6) return { icon: 'target', tone: 'gold', jsx: <>Estás a <span className="kb-gold">{b(gapAbove)}</span> pts de <b>{above.name}</b>.</> };
    if (gapAbove <= 15) return { icon: 'bolt', tone: 'green', jsx: <>Aprieta: <b>{above.name}</b> está a <span className="kb-grn">{b(gapAbove)}</span> pts.</> };
    return { icon: 'arrowUp', tone: 'blue', jsx: <>A por la remontada: <span style={{ color: 'var(--blue)' }}>{b(gapAbove)}</span> pts hasta <b>{above.name}</b>.</> };
  })();
  const bTone = { gold: 'var(--gold)', red: 'var(--red)', green: 'var(--green)', blue: 'var(--blue)' }[banner.tone];
  const bBg = { gold: 'rgba(255,201,64,0.12)', red: 'rgba(255,82,71,0.12)', green: 'rgba(43,227,107,0.12)', blue: 'rgba(88,182,255,0.12)' }[banner.tone];

  return (
    <div className="kb-app">
      <div className="kb-header" style={{ paddingBottom: 6 }}>
        <Wordmark size={24} />
        <div className="kb-row" style={{ gap: 10 }}>
          <button className="kb-icon-btn" onClick={signOut} aria-label="Cerrar sesión"><Icon name="logout" size={19} /></button>
        </div>
      </div>

      <div className="kb-scroll" style={{ padding: '6px 20px 24px' }}>
        {import.meta.env.DEV && <ClockBar />}
        {heroes.length === 0 && (
          <div className="kb-card" style={{ padding: '18px', marginBottom: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>
            No hay jornadas abiertas ahora mismo.
          </div>
        )}
        {heroes.map((h) => <Hero key={h.comp + h.jornadaStr} {...h} onNav={onNav} />)}

        {/* Banner: interés en el Fantasy de KBetZA */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 13, padding: '14px 15px', marginBottom: 18, cursor: 'pointer',
          borderRadius: 'var(--r-xl)',
          background: 'linear-gradient(120deg, rgba(255,82,71,0.18), rgba(255,82,71,0.06))',
          border: '1px solid rgba(255,82,71,0.5)',
        }}>
          <input type="checkbox" checked={fantasy} onChange={toggleFantasy}
            style={{ width: 22, height: 22, flexShrink: 0, accentColor: 'var(--red)', cursor: 'pointer' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25 }}>
              ¿Te quieres unir al <span style={{ color: 'var(--red)' }}>Fantasy de KBetZA</span>?
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--red)', marginTop: 2 }}>
              {fantasy ? '¡Apuntado! 🎉' : '¡Marca esta casilla!'}
            </div>
          </div>
        </label>

        <div className="kb-between" style={{ marginBottom: 10, marginTop: 4 }}>
          <h2 className="kb-section-title">Tu posición · LaLiga</h2>
          <button onClick={() => onNav('ranking')} style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Ver ranking</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: 9, marginBottom: 18 }}>
          <StatTile icon="trophy" tone="gold" big={`#${myRank}`} label={`de ${players.length}`} />
          <StatTile icon="coins" tone="green" big={fmtPts(me.points)} label="puntos" />
          <StatTile icon="target" tone="blue" big={me.hits} label="aciertos" />
        </div>

        <div className="kb-card" style={{ padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, background: bBg, color: bTone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={banner.icon} size={20} />
          </span>
          <div style={{ fontSize: 13.5, lineHeight: 1.35 }}>{banner.jsx}</div>
        </div>

        <TablonPreview messages={messages} unread={unread} me={user.username} onOpen={openTablon} />
      </div>

      <BottomNav active="inicio" onNav={onNav} />
      {tablonOpen && <TablonScreen messages={messages} me={user.username} onSend={sendMessage} onClose={closeTablon} />}
    </div>
  );
}
