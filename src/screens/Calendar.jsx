import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Header, BottomNav, Loading, EmptyState } from '../components/ui.jsx';
import { CompBadge, teamLabel as label } from '../components/Badge.jsx';
import { getSeasonCalendar } from '../lib/api.js';
import { fmtFecha, fmtHora, diaLocal, kickoffDate } from '../lib/format.js';
import { useClock } from '../context/ClockContext.jsx';

export function CalendarScreen({ onNav }) {
  const { now } = useClock();
  const [comp, setComp] = useState('PD');
  const blue = comp === 'CL';
  const accent = blue ? 'var(--blue)' : 'var(--green)';
  const [jornadas, setJornadas] = useState(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setJornadas(null);
    getSeasonCalendar(comp).then((js) => {
      setJornadas(js);
      // Empezar en la jornada actual (la primera que no esté completamente jugada)
      const t = now();
      let def = js.findIndex((j) => j.last >= t);
      if (def < 0) def = Math.max(0, js.length - 1);
      setIdx(def);
    }).catch((e) => { console.error(e); setJornadas([]); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp]);

  const Toggle = (
    <div style={{ padding: '0 20px 12px', position: 'relative', zIndex: 2 }}>
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 4 }}>
        {[['PD', 'La Liga', 'shield'], ['CL', 'Champions', 'trophy']].map(([k, lbl, ic]) => (
          <button key={k} onClick={() => setComp(k)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: 0.4, textTransform: 'uppercase',
            background: comp === k ? (k === 'CL' ? 'linear-gradient(118deg,#58B6FF,#7BD0FF)' : 'var(--grad-green)') : 'transparent',
            color: comp === k ? (k === 'CL' ? '#06182A' : '#06210F') : 'var(--muted)',
          }}><Icon name={ic} size={16} /> {lbl}</button>
        ))}
      </div>
    </div>
  );

  const shell = (children) => (
    <div className={'kb-app' + (blue ? ' cl-scope' : '')}>
      <Header title="Calendario" sub="Toda la temporada" />
      {Toggle}
      {children}
      <BottomNav active="calendario" onNav={onNav} />
    </div>
  );

  if (!jornadas) return shell(<Loading />);
  if (!jornadas.length) return shell(<EmptyState icon="calendar" title="Aún no disponible"
    sub={blue ? 'El calendario de Champions se publicará tras el sorteo.' : 'Sin calendario cargado.'} />);

  const jr = jornadas[idx];
  const games = jr.matches;
  // Agrupamos por el día ESPAÑOL, no por la fecha UTC: un partido nocturno
  // pertenece al día en que se ve, no al día UTC del saque.
  const days = [...new Set(games.map((g) => diaLocal(g.fecha, g.hora)))].sort();

  return shell(
    <div className="kb-scroll" style={{ padding: '4px 20px 24px' }}>
      {/* Navegador de jornadas */}
      <div className="kb-card" style={{ padding: '9px 10px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="kb-icon-btn" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}
          style={{ opacity: idx === 0 ? 0.3 : 1 }} aria-label="Jornada anterior"><Icon name="chevronL" size={19} /></button>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 15, color: accent, textTransform: 'uppercase', letterSpacing: 0.4 }}>{jr.label}</div>
          <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>
            {games.length} partidos · {fmtFecha(days[0])}{days.length > 1 ? ' – ' + fmtFecha(days[days.length - 1]) : ''}
          </div>
        </div>
        <button className="kb-icon-btn" disabled={idx === jornadas.length - 1} onClick={() => setIdx((i) => Math.min(jornadas.length - 1, i + 1))}
          style={{ opacity: idx === jornadas.length - 1 ? 0.3 : 1 }} aria-label="Jornada siguiente"><Icon name="chevronR" size={19} /></button>
      </div>

      {days.map((day) => {
        const dayGames = games.filter((g) => diaLocal(g.fecha, g.hora) === day)
          .sort((a, b) => kickoffDate(a.fecha, a.hora) - kickoffDate(b.fecha, b.hora));
        return (
          <div key={day}>
            <div className="kb-row" style={{ gap: 10, margin: '18px 2px 10px' }}>
              <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: accent, whiteSpace: 'nowrap' }}>{fmtFecha(day)}</span>
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{dayGames.length} partidos</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayGames.map((g) => (
                <div key={g.id_partido} className="kb-card" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 46, textAlign: 'center', flexShrink: 0 }}>
                    {g.resultado ? (
                      <div className="kb-num" style={{ fontSize: 14, color: 'var(--text)' }}>{g.marcador}</div>
                    ) : (
                      <div className="kb-num" style={{ fontSize: 15, color: accent }}>{fmtHora(g.hora, g.fecha)}</div>
                    )}
                  </div>
                  <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ flex: 1, textAlign: 'right', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label(comp, g.id_local, g.equipo_local)}</span>
                    <CompBadge comp={comp} id={g.id_local} name={g.equipo_local} size={28} />
                    <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 11, color: 'var(--muted-2)', flexShrink: 0 }}>VS</span>
                    <CompBadge comp={comp} id={g.id_visitante} name={g.equipo_visitante} size={28} />
                    <span style={{ flex: 1, textAlign: 'left', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label(comp, g.id_visitante, g.equipo_visitante)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
