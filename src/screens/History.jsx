import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Header, BottomNav, MatchTeams, Loading, EmptyState } from '../components/ui.jsx';
import { CompBadge, teamLabel as label } from '../components/Badge.jsx';
import { getHistory, getPlayerStandings } from '../lib/api.js';
import { fmtPts } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';

export function HistoryScreen({ onNav }) {
  const { user } = useAuth();
  const [comp, setComp] = useState('PD');
  const blue = comp === 'CL';
  const accent = blue ? 'var(--blue)' : 'var(--green)';
  const [list, setList] = useState(null);
  const [me, setMe] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    let alive = true;
    setList(null); setMe(null); setOpen(null);
    Promise.all([getHistory(user.username, comp), getPlayerStandings(comp)])
      .then(([h, players]) => {
        if (!alive) return;
        setList(h);
        if (h.length) setOpen(h[0].jornada);
        setMe(players.find((p) => p.name === user.username) || { points: 0, hits: 0 });
      })
      .catch((e) => { console.error(e); if (alive) setList([]); });
    return () => { alive = false; };
  }, [user.username, comp]);

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
      <Header title="Historial" sub="Mis quinielas" />
      {Toggle}
      {children}
      <BottomNav active="historial" onNav={onNav} />
    </div>
  );

  if (list === null) return shell(<Loading />);
  if (!list.length) return shell(<EmptyState icon="history" title="Sin historial todavía" sub={`Aún no has enviado ninguna quiniela de ${blue ? 'Champions' : 'LaLiga'}.`} />);

  const best = list.reduce((a, b) => (b.points > a.points ? b : a), list[0]);

  return shell(
    <div className="kb-scroll" style={{ padding: '4px 20px 24px' }}>
      <div className="kb-card" style={{ padding: '14px 16px', marginBottom: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[['Puntos', fmtPts(me?.points || 0), 'var(--gold)'], ['Aciertos', me?.hits || 0, 'var(--text)'], ['Mejor', `J${best.jornada}`, accent]].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div className="kb-num" style={{ fontSize: 20, color: c }}>{v}</div>
            <div style={{ fontSize: 10, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      <h2 className="kb-section-title" style={{ marginBottom: 10 }}>Por jornada</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((j) => {
          const expandable = j.bets.length > 0;
          const isOpen = open === j.jornada && expandable;
          return (
            <div key={j.jornada} className="kb-card" style={{ overflow: 'hidden' }}>
              <button onClick={() => expandable && setOpen(isOpen ? null : j.jornada)} style={{ width: '100%', background: 'none', border: 'none', cursor: expandable ? 'pointer' : 'default', padding: '14px 15px', display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: j.rank === 1 ? 'rgba(255,201,64,0.13)' : 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9, color: 'var(--muted-2)', textTransform: 'uppercase' }}>Jorn</span>
                  <span className="kb-num" style={{ fontSize: 18, color: 'var(--text)', lineHeight: 1 }}>{j.jornada}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="kb-between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{j.rank ? `Posición #${j.rank}` : (j.total === 0 ? 'Quiniela enviada' : 'Jornada jugada')}</span>
                    <span className="kb-num" style={{ fontSize: 16, color: accent }}>+{fmtPts(j.points)}</span>
                  </div>
                  <div className="kb-row" style={{ gap: 8 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(j.hits / Math.max(j.total, 1)) * 100}%`, background: blue ? 'linear-gradient(118deg,#58B6FF,#7BD0FF)' : 'var(--grad-green)', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                      {j.hits}/{j.total}
                      {j.pending > 0 && <span style={{ color: 'var(--muted-2)' }}> · {j.pending} pend.</span>}
                    </span>
                    {j.rank === 1 && <span style={{ color: 'var(--gold)' }}><Icon name="crown" size={14} /></span>}
                    {expandable && <span style={{ color: 'var(--muted-2)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}><Icon name="chevronR" size={15} /></span>}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: '1px solid var(--line)', padding: '6px 15px 12px' }}>
                  {j.bets.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < j.bets.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <MatchTeams
                          homeBadge={<CompBadge comp={comp} id={b.homeId} name={b.home} size={44} />} homeLabel={label(comp, b.homeId, b.home)}
                          awayBadge={<CompBadge comp={comp} id={b.awayId} name={b.away} size={44} />} awayLabel={label(comp, b.awayId, b.away)} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--muted-2)', textTransform: 'uppercase' }}>Tú</div>
                          <div className="kb-num" style={{ fontSize: 15 }}>{b.pick || '-'}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--muted-2)', textTransform: 'uppercase' }}>Pts</div>
                          {/* Pendiente: aún no hay puntos, se muestra la cuota en juego */}
                          <div className="kb-num" style={{ fontSize: 15, color: !b.played ? 'var(--muted-2)' : b.ok ? 'var(--green)' : 'var(--muted-2)' }}>
                            {!b.played ? fmtPts(b.odd) : b.ok ? '+' + fmtPts(b.odd) : '0'}
                          </div>
                        </div>
                        <span style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: !b.played ? 'var(--surface-3)' : b.ok ? 'rgba(43,227,107,0.15)' : 'rgba(255,82,71,0.15)',
                          color: !b.played ? 'var(--muted-2)' : b.ok ? 'var(--green)' : 'var(--red)',
                        }}>
                          <Icon name={!b.played ? 'clock' : b.ok ? 'check' : 'x'} size={13} stroke={2.6} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
