import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Header, MatchTeams, BottomNav, Loading, EmptyState } from '../components/ui.jsx';
import { CompBadge, teamLabel as label } from '../components/Badge.jsx';
import { getMyCurrentBet } from '../lib/api.js';
import { fmtOdd, fmtPts, fmtFecha, fmtHora } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';

function BetStat({ big, label, tone }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid var(--line)' }}>
      <div className="kb-num" style={{ fontSize: 22, color: tone || 'var(--text)' }}>{big}</div>
      <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

export function MyBetScreen({ onNav, comp = 'PD', jornada }) {
  const { user } = useAuth();
  const blue = comp === 'CL';
  const accent = blue ? 'var(--blue)' : 'var(--green)';
  const [data, setData] = useState(undefined);

  useEffect(() => {
    let alive = true;
    getMyCurrentBet(user.username, comp, jornada).then((d) => { if (alive) setData(d); }).catch((e) => { console.error(e); if (alive) setData(null); });
    return () => { alive = false; };
  }, [user.username, comp, jornada]);

  const cls = 'kb-app' + (blue ? ' cl-scope' : '');
  if (data === undefined) return <div className={cls}><Header title="Mi apuesta" onBack={() => onNav('inicio')} /><Loading /><BottomNav active="" onNav={onNav} /></div>;
  if (!data) return (
    <div className={cls}>
      <Header title="Mi apuesta" onBack={() => onNav('inicio')} />
      <EmptyState icon="ticket" title="No hay quiniela activa" sub={`No hay próximos partidos de ${blue ? 'Champions' : 'LaLiga'}.`} />
      <BottomNav active="" onNav={onNav} />
    </div>
  );

  const { bets, picked, resolved, hits, points, total } = data;
  const estado = resolved === 0 ? 'Pendiente' : resolved === total ? 'Finalizada' : 'En juego';
  const sub = `${blue ? 'Champions' : 'LaLiga'} · ${data.label}`;
  const goEdit = () => onNav('apostar', { comp, jornada: data.jornadaStr });

  return (
    <div className={cls}>
      <Header title="Mi apuesta" sub={sub} onBack={() => onNav('inicio')}
        right={<button className="kb-icon-btn" aria-label="Editar" onClick={goEdit}><Icon name="edit" size={18} /></button>} />
      <div className="kb-scroll" style={{ padding: '4px 20px 24px' }}>
        <div style={{ borderRadius: 'var(--r-xl)', padding: '18px', marginBottom: 18, background: blue ? 'linear-gradient(150deg,#10243B 0%,#0B1422 60%)' : 'linear-gradient(150deg,#15301E 0%,#0E1A12 60%)', border: `1px solid ${blue ? 'rgba(88,182,255,0.25)' : 'rgba(43,227,107,0.22)'}` }}>
          <div className="kb-between" style={{ marginBottom: 16 }}>
            <span className={'kb-pill ' + (blue ? 'blue' : 'green')}><Icon name={estado === 'En juego' ? 'bolt' : estado === 'Finalizada' ? 'check' : 'clock'} size={13} stroke={2.4} /> {estado}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{picked}/{total} pronosticados</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <BetStat big={resolved > 0 ? hits : `${picked}/${total}`} label={resolved > 0 ? 'aciertos' : 'pronósticos'} tone={resolved > 0 ? accent : undefined} />
            <BetStat big={resolved > 0 ? fmtPts(points) : '—'} label="puntos" tone="var(--gold)" />
            <BetStat big={`${resolved}/${total}`} label="resueltos" />
          </div>
        </div>

        <h2 className="kb-section-title" style={{ marginBottom: 10 }}>Mis pronósticos</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {bets.map((b) => (
            <div key={b.matchId} className="kb-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              {!b.played && (
                <div style={{ width: 40, flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtFecha(b.fecha)}</div>
                  <div className="kb-num" style={{ fontSize: 12, color: 'var(--muted-2)' }}>{fmtHora(b.hora)}</div>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <MatchTeams
                  homeBadge={<CompBadge comp={comp} id={b.homeId} name={b.home} size={40} />} homeLabel={label(comp, b.homeId, b.home)}
                  awayBadge={<CompBadge comp={comp} id={b.awayId} name={b.away} size={40} />} awayLabel={label(comp, b.awayId, b.away)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--muted-2)', textTransform: 'uppercase' }}>Tú</div>
                  <div className="kb-num" style={{ fontSize: 15 }}>{b.pick || '–'}</div>
                </div>
                {b.played ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--muted-2)', textTransform: 'uppercase' }}>Pts</div>
                    <div className="kb-num" style={{ fontSize: 15, color: b.ok ? 'var(--green)' : 'var(--muted-2)' }}>{b.ok ? '+' + fmtPts(b.odd) : '0'}</div>
                  </div>
                ) : (b.odd ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--muted-2)', textTransform: 'uppercase' }}>Cuota</div>
                    <div className="kb-num" style={{ fontSize: 15, color: 'var(--muted)' }}>{fmtOdd(b.odd)}</div>
                  </div>
                ) : null)}
                {b.played && b.pick && (
                  <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: b.ok ? 'rgba(43,227,107,0.15)' : 'rgba(255,82,71,0.15)', color: b.ok ? 'var(--green)' : 'var(--red)' }}>
                    <Icon name={b.ok ? 'check' : 'x'} size={12} stroke={2.6} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button className={'kb-btn' + (blue ? ' blue' : '')} style={{ marginTop: 18 }} onClick={goEdit}>
          <Icon name="edit" size={18} /> {picked === total ? 'Editar quiniela' : 'Completar quiniela'}
        </button>
      </div>
      <BottomNav active="" onNav={onNav} />
    </div>
  );
}
