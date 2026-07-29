import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../components/Icon.jsx';
import { Header, BottomNav, Avatar, Loading } from '../components/ui.jsx';
import { CompBadge, teamLabel } from '../components/Badge.jsx';
import { getPlayerStandings, getPlayerStandingsLast, getPlayerStandingsGeneral, getGroupMembers, getLeagueStandings, isClLeaguePhaseOver, getClBracket, getUserBet, getBote, setBote } from '../lib/api.js';
import { fmtPts, fmtFecha, fmtHora, roundName } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';

const A_GENERAL = { color: 'var(--gold)', grad: 'linear-gradient(118deg,#FFC940 0%,#FFE08A 100%)', textOn: '#3A2A00', bg12: 'rgba(255,201,64,0.14)', bg06: 'rgba(255,201,64,0.07)', bd45: 'rgba(255,201,64,0.5)' };
const A_PD = { color: 'var(--green)', grad: 'var(--grad-green)', textOn: '#06210F', bg12: 'rgba(43,227,107,0.12)', bg06: 'rgba(43,227,107,0.06)', bd45: 'rgba(43,227,107,0.45)' };
const A_CL = { color: 'var(--blue)', grad: 'linear-gradient(118deg,#58B6FF 0%,#7BD0FF 100%)', textOn: '#06182A', bg12: 'rgba(88,182,255,0.12)', bg06: 'rgba(88,182,255,0.06)', bd45: 'rgba(88,182,255,0.45)' };
const GROUP_COLORS = ['#9C7BFF', '#5EE6C0', '#F4A261'];

const COMPS = [
  { key: 'GENERAL', label: 'General', icon: 'star', a: A_GENERAL, kind: 'combined' },
  { key: 'PD', label: 'La Liga', icon: 'shield', a: A_PD, kind: 'comp' },
  { key: 'CL', label: 'Champions', icon: 'trophy', a: A_CL, kind: 'comp' },
];

export function RankingScreen({ onNav }) {
  const { user } = useAuth();
  const groups = user.groups || [];

  // Nivel 1: ámbito (todo KBetZA o un grupo)
  const scopes = [{ key: 'ALL', label: 'General', color: 'var(--gold)' },
    ...groups.map((g, i) => ({ key: g, label: g, color: GROUP_COLORS[i % GROUP_COLORS.length] }))];

  const [scope, setScope] = useState('ALL');
  const [compKey, setCompKey] = useState('GENERAL');
  const [sub, setSub] = useState('players');
  const [members, setMembers] = useState(null); // null=todos, undefined=cargando grupo, Set=grupo

  useEffect(() => {
    if (scope === 'ALL') { setMembers(null); return; }
    setMembers(undefined);
    getGroupMembers(scope).then((m) => setMembers(new Set(m))).catch(() => setMembers(new Set()));
  }, [scope]);

  const comp = COMPS.find((c) => c.key === compKey);
  const a = comp.a;
  const groupLoading = scope !== 'ALL' && members === undefined;

  return (
    <div className={'kb-app' + (compKey === 'CL' ? ' cl-scope' : '')}>
      <Header title="Clasificación" sub="KBetZA" />

      {/* Nivel 1: ámbito (solo si el usuario tiene grupos) */}
      {groups.length > 0 && (
        <div style={{ padding: '0 20px 8px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {scopes.map((s) => {
              const on = scope === s.key;
              return (
                <button key={s.key} onClick={() => setScope(s.key)} style={{
                  flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 13px', borderRadius: 99, cursor: 'pointer', whiteSpace: 'nowrap',
                  border: '1px solid ' + (on ? s.color : 'var(--line)'),
                  background: on ? 'var(--surface-3)' : 'var(--surface)',
                  color: on ? s.color : 'var(--muted)', fontSize: 12.5, fontWeight: 600,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} /> {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nivel 2: competición */}
      <div style={{ padding: '0 20px 10px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 4 }}>
          {COMPS.map((c) => (
            <button key={c.key} onClick={() => { setCompKey(c.key); setSub('players'); }} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, letterSpacing: 0.3, textTransform: 'uppercase',
              background: compKey === c.key ? c.a.grad : 'transparent',
              color: compKey === c.key ? c.a.textOn : 'var(--muted)',
            }}><Icon name={c.icon} size={15} /> {c.label}</button>
          ))}
        </div>
      </div>

      {/* Nivel 3: jugadores / equipos (solo La Liga / Champions) */}
      {comp.kind === 'comp' && (
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ display: 'flex', gap: 7 }}>
            {[['players', 'Jugadores'], ['table', 'Clasificación']].map(([k, lbl]) => (
              <button key={k} onClick={() => setSub(k)} style={{
                padding: '6px 13px', borderRadius: 99, cursor: 'pointer',
                border: '1px solid ' + (sub === k ? a.color : 'var(--line)'),
                background: sub === k ? a.bg12 : 'var(--surface)',
                color: sub === k ? a.color : 'var(--muted)', fontSize: 12.5, fontWeight: 600,
              }}>{lbl}</button>
            ))}
          </div>
        </div>
      )}

      <div className="kb-scroll" style={{ padding: comp.kind === 'combined' ? '8px 20px 24px' : '4px 20px 24px' }}>
        {scope !== 'ALL' && <BoteBanner scope={scope} />}
        {groupLoading ? <Loading />
          : comp.kind === 'combined'
            ? <PlayersBoard key="GENERAL" a={A_GENERAL} mode="combined" members={members} />
            : (sub === 'players'
              ? <PlayersBoard key={compKey + '-p'} a={a} mode="comp" comp={compKey} members={members} />
              : <LeagueTable key={compKey + '-t'} comp={compKey} />)}
      </div>
      <BottomNav active="ranking" onNav={onNav} />
    </div>
  );
}

/* Banner de votación del BOTE por grupo (solo Familia/Sonaos, no General) */
function BoteBanner({ scope }) {
  const { user } = useAuth();
  const [b, setB] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setB(null); getBote(scope, user.username).then(setB).catch(() => setB(null)); }, [scope, user.username]);
  if (!b) return null;

  const { total, votos, voted, premio, cerrado } = b;
  const pct = total > 0 ? Math.min(100, Math.round((votos / total) * 100)) : 0;
  const allIn = total > 0 && votos >= total;
  const GOLD = '#FFC940';

  const vote = () => {
    if (cerrado || busy) return;
    setBusy(true);
    const next = !voted;
    setB((prev) => ({ ...prev, voted: next, votos: prev.votos + (next ? 1 : -1) }));
    setBote(user.username, scope, next)
      .then((res) => { if (res && res.total !== undefined) setB(res); })
      .catch(() => getBote(scope, user.username).then(setB))
      .finally(() => setBusy(false));
  };

  return (
    <div style={{
      overflow: 'hidden', borderRadius: 'var(--r-xl)', marginBottom: 18, padding: '15px 16px',
      background: `linear-gradient(120deg, rgba(255,201,64,${allIn ? 0.22 : 0.14}), rgba(255,201,64,0.04))`,
      border: `1px solid ${allIn ? GOLD : 'rgba(255,201,64,0.5)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,201,64,0.16)', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="coins" size={19} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 15, color: GOLD, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1.1 }}>Bote de {scope}</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{cerrado ? 'Votación cerrada' : 'Vota antes del fin de la Jornada 5'}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div className="kb-num" style={{ fontSize: 22, color: GOLD, lineHeight: 1 }}>{premio}€</div>
          <div style={{ fontSize: 9.5, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>al ganador</div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, margin: '2px 0 12px' }}>
        ¿Os jugáis un bote en <b>{scope}</b>? Si votáis <b>los {total}</b>, cada uno pone <b>5€</b> y el ganador se lleva <b style={{ color: GOLD }}>{premio}€</b>. 🔥
      </p>

      <div className="kb-between" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{votos} de {total} han votado</span>
        <span className="kb-num" style={{ fontSize: 12.5, color: allIn ? GOLD : 'var(--text)' }}>{pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden', marginBottom: 13 }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: `linear-gradient(90deg, ${GOLD}, #FFE08A)`, transition: 'width 0.3s' }} />
      </div>

      {allIn ? (
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 15, color: GOLD, textTransform: 'uppercase', letterSpacing: 0.5 }}>🎉 ¡Bote confirmado! Todos dentro</div>
      ) : cerrado ? (
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>Se cerró con {votos}/{total} votos — no salió el bote.</div>
      ) : (
        <button onClick={vote} disabled={busy} style={{
          width: '100%', padding: '11px', borderRadius: 11, cursor: busy ? 'default' : 'pointer',
          fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.4,
          background: voted ? 'var(--surface-3)' : `linear-gradient(118deg, ${GOLD}, #FFE08A)`,
          color: voted ? GOLD : '#3A2A00',
          border: voted ? `1px solid ${GOLD}` : 'none',
        }}>{voted ? '✓ Estás dentro · tocar para salir' : '¡Me apunto al bote!'}</button>
      )}
    </div>
  );
}

function PlayersBoard({ a, mode, comp, members }) {
  const { user } = useAuth();
  const combined = mode === 'combined';
  const [filter, setFilter] = useState('season');
  const [season, setSeason] = useState(null);
  const [last, setLast] = useState(null);
  const [reveal, setReveal] = useState(null);   // nombre pendiente de confirmar
  const [viewing, setViewing] = useState(null);  // nombre cuya apuesta se muestra

  useEffect(() => {
    if (combined) { getPlayerStandingsGeneral().then(setSeason).catch(console.error); }
    else {
      getPlayerStandings(comp).then(setSeason).catch(console.error);
      getPlayerStandingsLast(comp).then(setLast).catch(console.error);
    }
    // remonta por key (comp/modo); el filtro de grupo se aplica con members sin refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let data = filter === 'season' ? season : last?.rows;
  if (!data) return <Loading />;
  if (members) data = data.filter((p) => members.has(p.name));
  if (!data.length) return <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>Aún no hay puntos en esta clasificación.</p>;

  const marked = data.map((p) => ({ ...p, isUser: p.name === user.username }));
  const sorted = [...marked].sort((x, y) => y.points - x.points);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);

  // En "última jornada" (o jornada en juego) se puede tocar a un jugador para ver su apuesta
  const canReveal = !combined && filter === 'current' && !!(last && last.jornadaStr);
  const onPick = canReveal ? (e, name) => setReveal({ name, x: e.clientX, y: e.clientY }) : null;

  return (
    <>
      {!combined && (
        <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
          {[['season', 'Temporada'], ['current', last?.label || 'Última jornada']].map(([k, lbl]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '7px 14px', borderRadius: 99, cursor: 'pointer',
              border: '1px solid ' + (filter === k ? a.color : 'var(--line)'),
              background: filter === k ? a.bg12 : 'var(--surface)',
              color: filter === k ? a.color : 'var(--muted)', fontSize: 12.5, fontWeight: 600,
            }}>{lbl}</button>
          ))}
        </div>
      )}
      {canReveal && (
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '-6px 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="ticket" size={14} /> Toca a un jugador para ver su quiniela de esta jornada.
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 24, marginTop: 8 }}>
        {podium.map((p) => (
          <PodiumCard key={p.name} player={p} rank={p === top3[0] ? 1 : p === top3[1] ? 2 : 3} a={a} onClick={onPick && ((e) => onPick(e, p.name))} />
        ))}
      </div>
      {rest.length > 0 && <h2 className="kb-section-title" style={{ marginBottom: 10 }}>Clasificación completa</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rest.map((p, i) => (
          <div key={p.name} className="kb-card" onClick={onPick && ((e) => onPick(e, p.name))} style={{
            padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 12,
            borderColor: p.isUser ? a.bd45 : 'var(--line)',
            background: p.isUser ? a.bg06 : 'var(--surface)',
            cursor: onPick ? 'pointer' : 'default',
          }}>
            <span className="kb-num" style={{ width: 22, textAlign: 'center', fontSize: 16, color: 'var(--muted)' }}>{i + 4}</span>
            <Avatar name={p.name} size={38} you={p.isUser} accent={a.color} grad={a.grad} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, textTransform: 'capitalize' }}>{p.name} {p.isUser && <span style={{ color: a.color, fontSize: 11, fontWeight: 700 }}>· TÚ</span>}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>{p.hits} aciertos · {p.bets} jorn.</div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 7 }}>
              <div>
                <span className="kb-num" style={{ fontSize: 18, color: a.color }}>{fmtPts(p.points)}</span>
                <span style={{ fontSize: 10.5, color: 'var(--muted-2)', marginLeft: 3 }}>pts</span>
              </div>
              {onPick && <span style={{ color: 'var(--muted-2)' }}><Icon name="chevronR" size={16} /></span>}
            </div>
          </div>
        ))}
      </div>

      {reveal && (
        <RevealBubble x={reveal.x} y={reveal.y} a={a}
          onYes={() => { setViewing(reveal.name); setReveal(null); }}
          onNo={() => setReveal(null)} />
      )}
      {viewing && (
        <BetModal name={viewing} comp={comp} jornadaStr={last.jornadaStr} a={a}
          onClose={() => setViewing(null)} />
      )}
    </>
  );
}

/* Burbujita "Ver apuesta" justo donde se ha tocado */
function RevealBubble({ x, y, a, onYes, onNo }) {
  const W = 140, H = 40;
  const left = Math.min(Math.max((x || 0) - W / 2, 8), window.innerWidth - W - 8);
  const top = Math.max((y || 0) - H - 12, 8); // por encima del dedo
  return createPortal(
    <div onClick={onNo} style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
      <button onClick={(e) => { e.stopPropagation(); onYes(); }} style={{
        position: 'fixed', left, top, width: W, height: H, borderRadius: 12, cursor: 'pointer',
        border: 'none', background: a.grad, color: a.textOn,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 13.5, textTransform: 'uppercase', letterSpacing: 0.4,
        boxShadow: '0 8px 22px rgba(0,0,0,0.5)',
      }}>
        <Icon name="ticket" size={15} stroke={2} /> Ver apuesta
      </button>
    </div>,
    document.body,
  );
}

/* Badge del pronóstico (1 / X / 2) coloreado según acierto */
function PickBadge({ pick, ok }) {
  const tone = ok === true ? 'var(--green)' : ok === false ? 'var(--red)' : 'var(--muted-2)';
  const bg = ok === true ? 'rgba(43,227,107,0.14)' : ok === false ? 'rgba(255,82,71,0.14)' : 'var(--surface-3)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 26, height: 26, padding: '0 7px', borderRadius: 8, background: bg, color: tone, fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 14, border: `1px solid ${tone}` }}>
      {pick || '—'}
    </span>
  );
}

/* Modal con la quiniela de otro usuario */
function BetModal({ name, comp, jornadaStr, a, onClose }) {
  const [bet, setBet] = useState(null);
  useEffect(() => { getUserBet(name, comp, jornadaStr).then(setBet).catch(() => setBet({ error: true })); }, [name, comp, jornadaStr]);
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(340px, 94%)', maxHeight: 'min(72vh, 540px)', background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--line-2)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px 12px', borderBottom: '1px solid var(--line)' }}>
          <Avatar name={name} size={34} gold accent={a.color} grad={a.grad} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, textTransform: 'capitalize', lineHeight: 1.15 }}>{name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{bet && !bet.error ? bet.label : roundName(jornadaStr)}</div>
          </div>
          <button onClick={onClose} className="kb-icon-btn" aria-label="Cerrar"><Icon name="x" size={18} /></button>
        </div>

        <div className="kb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 13px 16px' }}>
          {!bet ? <Loading />
            : bet.error ? <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>No se pudo cargar la apuesta.</p>
            : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <div className="kb-card" style={{ flex: 1, padding: '10px 8px', textAlign: 'center', background: 'var(--surface-2)' }}>
                    <div className="kb-num" style={{ fontSize: 19, color: a.color }}>{fmtPts(bet.points)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>puntos</div>
                  </div>
                  <div className="kb-card" style={{ flex: 1, padding: '10px 8px', textAlign: 'center', background: 'var(--surface-2)' }}>
                    <div className="kb-num" style={{ fontSize: 19, color: 'var(--text)' }}>{bet.hits}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>aciertos</div>
                  </div>
                  <div className="kb-card" style={{ flex: 1, padding: '10px 8px', textAlign: 'center', background: 'var(--surface-2)' }}>
                    <div className="kb-num" style={{ fontSize: 19, color: a.color }}>{fmtPts(bet.points * bet.hits)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>puntos × aciertos</div>
                  </div>
                </div>
                {bet.pending > 0 && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="lock" size={13} /> {bet.pending} {bet.pending === 1 ? 'partido aún no ha comenzado' : 'partidos aún no han comenzado'} (oculto).
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bet.bets.map((b) => (
                    <div key={b.matchId} className="kb-card" style={{ padding: '9px 11px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', opacity: b.played ? 1 : 0.55, background: 'var(--surface-2)' }}>
                      <div className="kb-row" style={{ gap: 7, minWidth: 0, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{teamLabel(comp, b.homeId, b.home)}</span>
                        <CompBadge comp={comp} id={b.homeId} name={b.home} size={22} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 58 }}>
                        {b.played
                          ? <>
                              <PickBadge pick={b.pick} ok={b.ok} />
                              <span style={{ fontSize: 10, color: 'var(--muted-2)' }}>{b.result ? `Res: ${b.result}` : 'En juego'}</span>
                            </>
                          : <span style={{ fontSize: 10, color: 'var(--muted-2)', textAlign: 'center', lineHeight: 1.25 }}>{fmtFecha(b.fecha)}<br />{fmtHora(b.hora)}</span>}
                      </div>
                      <div className="kb-row" style={{ gap: 7, minWidth: 0 }}>
                        <CompBadge comp={comp} id={b.awayId} name={b.away} size={22} />
                        <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teamLabel(comp, b.awayId, b.away)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PodiumCard({ player, rank, a, onClick }) {
  const cfg = {
    1: { h: 152, color: 'var(--gold)', bg: 'rgba(255,201,64,0.12)', av: 64, icon: 'crown' },
    2: { h: 128, color: '#CBD5DA', bg: 'rgba(203,213,218,0.1)', av: 54, icon: 'medal' },
    3: { h: 116, color: '#E0A36B', bg: 'rgba(224,163,107,0.12)', av: 54, icon: 'medal' },
  }[rank];
  return (
    <div onClick={onClick} style={{ flex: 1, maxWidth: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        {rank === 1 && <span style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', color: 'var(--gold)' }}><Icon name="crown" size={24} /></span>}
        <span style={{ position: 'relative' }}>
          <Avatar name={player.name} size={cfg.av} gold={rank === 1} you={player.isUser} accent={a.color} grad={a.grad} />
          <span style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: '50%', background: 'var(--bg)', border: `2px solid ${cfg.color}`, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 13 }}>{rank}</span>
        </span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2, textAlign: 'center', textTransform: 'capitalize', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</div>
      {player.isUser && <div style={{ color: a.color, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>TÚ</div>}
      <div style={{ width: '100%', height: cfg.h, borderRadius: '14px 14px 0 0', background: `linear-gradient(180deg, ${cfg.bg}, transparent)`, border: '1px solid var(--line)', borderBottom: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14, gap: 3, marginTop: 4 }}>
        <span style={{ color: cfg.color }}><Icon name={cfg.icon} size={20} /></span>
        <span className="kb-num" style={{ fontSize: 22, color: 'var(--text)' }}>{fmtPts(player.points)}</span>
        <span style={{ fontSize: 9.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>puntos</span>
        <span style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{player.hits} ✓</span>
      </div>
    </div>
  );
}

function LeagueTable({ comp }) {
  const blue = comp === 'CL';
  const [rows, setRows] = useState(null);
  // En Champions: si ya terminó la fase liga, se muestra el cuadro de eliminatorias
  const [phaseOver, setPhaseOver] = useState(blue ? null : false);
  useEffect(() => {
    if (blue) isClLeaguePhaseOver().then(setPhaseOver).catch(() => setPhaseOver(false));
    else setPhaseOver(false);
    getLeagueStandings(comp).then(setRows).catch(console.error);
  }, [comp]);

  if (blue && phaseOver === null) return <Loading />;
  if (blue && phaseOver) return <Bracket />;
  if (!rows) return <Loading />;
  if (!rows.length) return <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>Sin clasificación disponible.</p>;

  const zone = (i) => {
    if (blue) {
      if (i < 8) return 'var(--green)';     // 1-8: octavos directo
      if (i < 24) return '#F4A261';         // 9-24: play-off (un partido más)
      return 'var(--red)';                  // 25-36: eliminados
    }
    if (i < 4) return 'var(--green)';
    if (i === 4) return 'var(--blue)';
    if (i === 5) return '#9C7BFF';
    if (i >= rows.length - 3) return 'var(--red)';
    return 'transparent';
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr 30px 36px 36px', gap: 8, padding: '0 12px 8px' }}>
        <span style={{ fontSize: 10.5, color: 'var(--muted-2)', textTransform: 'uppercase' }}>#</span>
        <span style={{ fontSize: 10.5, color: 'var(--muted-2)', textTransform: 'uppercase' }}>Equipo</span>
        <span style={{ fontSize: 10.5, color: 'var(--muted-2)', textAlign: 'center' }}>PJ</span>
        <span style={{ fontSize: 10.5, color: 'var(--muted-2)', textAlign: 'center' }}>DG</span>
        <span style={{ fontSize: 10.5, color: 'var(--muted-2)', textAlign: 'center' }}>PTS</span>
      </div>
      <div className="kb-card" style={{ padding: '4px 0', overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <div key={row.id + '-' + i} style={{ display: 'grid', gridTemplateColumns: '26px 1fr 30px 36px 36px', gap: 8, alignItems: 'center', padding: '9px 12px', borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, background: zone(i) }} />
            <span className="kb-num" style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>{i + 1}</span>
            <div className="kb-row" style={{ gap: 9, minWidth: 0 }}>
              <CompBadge comp={comp} id={row.id} name={row.name} size={26} />
              <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teamLabel(comp, row.id, row.name)}</span>
            </div>
            <span className="kb-num" style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>{row.pj}</span>
            <span className="kb-num" style={{ textAlign: 'center', fontSize: 13, color: row.dg > 0 ? 'var(--green)' : row.dg < 0 ? 'var(--red)' : 'var(--muted)' }}>{row.dg > 0 ? '+' : ''}{row.dg}</span>
            <span className="kb-num" style={{ textAlign: 'center', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{row.pts}</span>
          </div>
        ))}
      </div>
      {!blue ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 14, padding: '0 4px' }}>
          {[['var(--green)', 'Champions'], ['var(--blue)', 'Europa League'], ['#9C7BFF', 'Conference'], ['var(--red)', 'Descenso']].map(([c, l]) => (
            <span key={l} className="kb-row" style={{ gap: 6, fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: c }} /> {l}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 14, padding: '0 4px' }}>
          {[['var(--green)', 'Octavos directo (1-8)'], ['#F4A261', 'Play-off · un partido más (9-24)'], ['var(--red)', 'Eliminados']].map(([c, l]) => (
            <span key={l} className="kb-row" style={{ gap: 6, fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: c }} /> {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Cuadro de eliminatorias (Champions) ---------------- */
const KO_ROUNDS = [
  ['Playoff', 'Play-off'],
  ['Octavos', 'Octavos de final'],
  ['Cuartos', 'Cuartos de final'],
  ['Semifinales', 'Semifinales'],
  ['Final', 'Final'],
];

function BracketMatch({ m }) {
  return (
    <div className="kb-card" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, padding: '10px 12px', marginBottom: 8 }}>
      <div className="kb-row" style={{ gap: 8, minWidth: 0, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{teamLabel('CL', m.id_local, m.equipo_local)}</span>
        <CompBadge comp="CL" id={m.id_local} name={m.equipo_local} size={24} />
      </div>
      <div style={{ minWidth: 52, textAlign: 'center' }}>
        {m.jugado
          ? <span className="kb-num" style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{m.marcador || '—'}</span>
          : <span style={{ fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.25, display: 'block' }}>{fmtFecha(m.fecha)}<br />{fmtHora(m.hora)}</span>}
      </div>
      <div className="kb-row" style={{ gap: 8, minWidth: 0 }}>
        <CompBadge comp="CL" id={m.id_visitante} name={m.equipo_visitante} size={24} />
        <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teamLabel('CL', m.id_visitante, m.equipo_visitante)}</span>
      </div>
    </div>
  );
}

function Bracket() {
  const [matches, setMatches] = useState(null);
  useEffect(() => { getClBracket().then(setMatches).catch(console.error); }, []);
  if (!matches) return <Loading />;
  if (!matches.length) return <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 30 }}>El cuadro aún no está disponible.</p>;
  const byRound = {};
  matches.forEach((m) => { (byRound[m.jornada] ||= []).push(m); });
  return (
    <div>
      {KO_ROUNDS.filter(([k]) => byRound[k]).map(([k, lbl]) => (
        <div key={k} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 10px' }}>
            <h2 style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--blue)', margin: 0 }}>{lbl}</h2>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{byRound[k].length} {byRound[k].length === 1 ? 'partido' : 'partidos'}</span>
          </div>
          {byRound[k].map((m) => <BracketMatch key={m.id_partido} m={m} />)}
        </div>
      ))}
    </div>
  );
}
