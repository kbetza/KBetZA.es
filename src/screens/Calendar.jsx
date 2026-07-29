import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Header, BottomNav, Loading, EmptyState } from '../components/ui.jsx';
import { CompBadge, teamLabel as label } from '../components/Badge.jsx';
import { getCurrentMatchday } from '../lib/api.js';
import { fmtFecha, fmtHora } from '../lib/format.js';

export function CalendarScreen({ onNav }) {
  const [comp, setComp] = useState('PD');
  const blue = comp === 'CL';
  const accent = blue ? 'var(--blue)' : 'var(--green)';
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    getCurrentMatchday(comp).then(setData).catch((e) => { console.error(e); setData({ jornada: null, matches: [] }); });
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
      <Header title="Calendario" sub="Jornada en juego" />
      {Toggle}
      {children}
      <BottomNav active="calendario" onNav={onNav} />
    </div>
  );

  if (!data) return shell(<Loading />);
  if (!data.matches.length) return shell(<EmptyState icon="calendar" title="No hay jornada cargada" />);

  const games = data.matches;
  const days = [...new Set(games.map((g) => g.fecha))].sort();

  return shell(
    <div className="kb-scroll" style={{ padding: '4px 20px 24px' }}>
      <div className="kb-card" style={{ padding: '14px 16px', marginBottom: 8 }}>
        <span className={'kb-eyebrow' + (blue ? ' blue' : '')}>{data.label} · {blue ? 'Champions' : 'LaLiga'}</span>
        <div className="kb-row" style={{ gap: 7, marginTop: 10, color: 'var(--muted)', fontSize: 13 }}>
          <Icon name="calendar" size={16} /> {games.length} partidos · del {fmtFecha(days[0])} al {fmtFecha(days[days.length - 1])}
        </div>
      </div>

      {days.map((day) => {
        const dayGames = games.filter((g) => g.fecha === day).sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
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
                      <div className="kb-num" style={{ fontSize: 15, color: accent }}>{fmtHora(g.hora)}</div>
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
