import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Header, MatchTeams, Loading, EmptyState } from '../components/ui.jsx';
import { CompBadge, teamLabel as label } from '../components/Badge.jsx';
import { getCurrentMatchday, getMyPicks, submitBet } from '../lib/api.js';
import { fmtOdd, fmtFecha, fmtHora, roundName } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';

function pickOdd(m, p) {
  if (p === '1') return m.cuota_local;
  if (p === 'X') return m.cuota_empate;
  return m.cuota_visitante;
}

export function BetScreen({ onBack, onNav, comp = 'PD', jornada }) {
  const { user } = useAuth();
  const blue = comp === 'CL';
  const [state, setState] = useState({ loading: true });
  const [sel, setSel] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const md = await getCurrentMatchday(comp);
      if (!md.matches.length) { if (alive) setState({ loading: false, empty: true }); return; }
      const target = jornada || md.matches[0].jornada;
      const jmatches = md.matches.filter((m) => m.jornada === target);
      if (!jmatches.length) { if (alive) setState({ loading: false, empty: true }); return; }
      const picks = await getMyPicks(user.username, comp);
      if (!alive) return;
      const initial = {};
      const locked = new Set();
      jmatches.forEach((m) => { if (picks[m.id_partido]) { initial[m.id_partido] = picks[m.id_partido].pick; locked.add(m.id_partido); } });
      // Las apuestas no son editables: si TODA la jornada visible ya está apostada, a ver mi apuesta
      if (locked.size === jmatches.length) { onNav('miapuesta', { comp, jornada: target }); return; }
      setSel(initial);
      setState({ loading: false, matches: jmatches, jornadaStr: target, locked });
    })().catch((e) => { console.error(e); if (alive) setState({ loading: false, error: true }); });
    return () => { alive = false; };
  }, [user.username, comp, jornada]);

  const cls = 'kb-app' + (blue ? ' cl-scope' : '');
  if (state.loading) return <div className={cls}><Header title="Quiniela" /><Loading /></div>;
  if (state.empty) return <div className={cls}><Header title="Quiniela" onBack={onBack} /><EmptyState icon="calendar" title="No hay partidos abiertos" sub="No hay próximos partidos para apostar ahora mismo." /></div>;
  if (state.error) return <div className={cls}><Header title="Quiniela" onBack={onBack} /><EmptyState icon="info" title="Error cargando los partidos" /></div>;

  const matches = state.matches;
  const locked = state.locked || new Set();
  const accent = blue ? 'var(--blue)' : 'var(--green)';
  const picked = Object.keys(sel).length;
  const complete = picked === matches.length;
  const sumCuotas = matches.reduce((acc, m) => sel[m.id_partido] ? acc + Number(pickOdd(m, sel[m.id_partido])) : acc, 0);
  const maxCuota = sumCuotas * picked;
  const choose = (id, pick) => { if (locked.has(id)) return; setSel((s) => ({ ...s, [id]: pick })); };

  const submit = async () => {
    if (!complete || sending) return;
    setSending(true); setError('');
    const bets = matches.map((m) => ({ idpartido: m.id_partido, pronostico: sel[m.id_partido], cuota: pickOdd(m, sel[m.id_partido]) }));
    try {
      const res = await submitBet(user.username, bets, comp);
      if (res?.success) { setSent(true); setTimeout(() => onNav('miapuesta', { comp, jornada: state.jornadaStr }), 1100); }
      else { setError(res?.error || 'No se pudo guardar.'); setSending(false); }
    } catch (e) { console.error(e); setError('Error al enviar. Inténtalo de nuevo.'); setSending(false); }
  };

  if (sent) {
    return (
      <div className={cls}>
        <div className="kb-scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 30 }}>
            <span style={{ width: 96, height: 96, borderRadius: '50%', background: blue ? 'linear-gradient(118deg,#58B6FF,#7BD0FF)' : 'var(--grad-green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: blue ? '#06182A' : '#06210F', marginBottom: 22, boxShadow: `0 0 0 10px ${blue ? 'rgba(88,182,255,0.12)' : 'rgba(43,227,107,0.12)'}` }}>
              <Icon name="check" size={50} stroke={2.6} />
            </span>
            <h2 className="kb-display" style={{ fontSize: 28, margin: '0 0 8px' }}>¡Quiniela guardada!</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>{matches.length} pronósticos</p>
          </div>
        </div>
      </div>
    );
  }

  const sub = `${blue ? 'Champions' : 'LaLiga'} · ${roundName(state.jornadaStr)}`;

  return (
    <div className={cls}>
      <Header title="Quiniela" sub={sub} onBack={onBack} />

      <div style={{ padding: '0 20px 12px', position: 'relative', zIndex: 2 }}>
        <div className="kb-between" style={{ marginBottom: 7 }}>
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Pronósticos completados</span>
          <span className="kb-num" style={{ fontSize: 14, color: complete ? (blue ? 'var(--blue)' : 'var(--green)') : 'var(--text)' }}>{picked}/{matches.length}</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(picked / matches.length) * 100}%`, background: blue ? 'linear-gradient(118deg,#58B6FF,#7BD0FF)' : 'var(--grad-green)', borderRadius: 99, transition: 'width 0.3s' }} />
        </div>
      </div>

      <div className="kb-scroll" style={{ padding: '4px 20px 160px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {matches.map((m, i) => {
            const isLocked = locked.has(m.id_partido);
            return (
              <div key={m.id_partido} className="kb-card" style={{ padding: '13px 14px' }}>
                <div className="kb-between" style={{ marginBottom: 11 }}>
                  <span className="kb-row" style={{ gap: 6, fontSize: 11.5, color: 'var(--muted-2)' }}>
                    <Icon name="calendar" size={13} /> {fmtFecha(m.fecha)} · {fmtHora(m.hora)}
                  </span>
                  {isLocked
                    ? <span className="kb-row" style={{ gap: 4, fontSize: 10.5, color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}><Icon name="lock" size={12} /> Apostada</span>
                    : <span style={{ fontSize: 11, color: 'var(--muted-2)', fontFamily: 'var(--font-cond)', fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</span>}
                </div>
                <div style={{ marginBottom: 13 }}>
                  <MatchTeams
                    homeBadge={<CompBadge comp={comp} id={m.id_local} name={m.equipo_local} size={56} />} homeLabel={label(comp, m.id_local, m.equipo_local)}
                    awayBadge={<CompBadge comp={comp} id={m.id_visitante} name={m.equipo_visitante} size={56} />} awayLabel={label(comp, m.id_visitante, m.equipo_visitante)} />
                </div>
                <div className="kb-odds">
                  {['1', 'X', '2'].map((p) => {
                    const isSel = sel[m.id_partido] === p;
                    return (
                      <button key={p} className={'kb-odd' + (isSel ? ' sel' : '')} disabled={isLocked} onClick={() => choose(m.id_partido, p)}
                        style={isLocked ? { opacity: isSel ? 1 : 0.3, cursor: 'default' } : undefined}>
                        <span className="pick">{p}</span>
                        <span className="val">{fmtOdd(pickOdd(m, p))}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 5, padding: '14px 20px 32px', background: 'linear-gradient(180deg, rgba(9,13,10,0) 0%, var(--bg) 28%)' }}>
        {error && <p style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', margin: '0 0 8px' }}>{error}</p>}
        <div className="kb-between kb-card" style={{ padding: '9px 14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Cuota máxima</span>
            <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{picked > 0 ? `si aciertas tus ${picked} pronósticos` : 'suma de cuotas × nº de aciertos'}</span>
          </div>
          <span className="kb-num" style={{ fontSize: 20, color: blue ? 'var(--blue)' : 'var(--green)' }}>{picked > 0 ? fmtOdd(maxCuota) : '—'}</span>
        </div>
        <button className={'kb-btn' + (blue ? ' blue' : '')} disabled={!complete || sending} onClick={submit}>
          {sending ? 'Guardando…' : complete ? <>Guardar quiniela <Icon name="chevronR" size={19} stroke={2.4} /></> : `Faltan ${matches.length - picked} pronósticos`}
        </button>
      </div>
    </div>
  );
}
