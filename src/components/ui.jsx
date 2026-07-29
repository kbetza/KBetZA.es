/* Componentes compartidos de UI — portados del prototipo a ESM */
import { useState, useEffect } from 'react';
import { Icon } from './Icon.jsx';
import { teamLogo, teamName } from '../lib/teams.js';
import { getActiveJornadas } from '../lib/api.js';

export function Wordmark({ size = 22 }) {
  return (
    <span className="kb-wordmark" style={{ fontSize: size }}>
      <span className="kb-k">K</span><span className="kb-bet">Bet</span><span className="kb-k">ZA</span>
    </span>
  );
}

export function TeamLogo({ id, size = 34 }) {
  return (
    <span className="kb-team-logo" style={{ width: size, height: size }}>
      <img src={teamLogo(id)} alt={teamName(id)} loading="lazy"
        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
    </span>
  );
}

export function Avatar({ name, size = 40, gold, you, accent = 'var(--green)', grad }) {
  const goldBg = grad || (accent === 'var(--blue)' ? 'linear-gradient(118deg,#58B6FF,#7BD0FF)' : 'var(--grad-green)');
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: gold ? goldBg : 'var(--surface-3)',
      color: gold ? '#06182A' : 'var(--text)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-cond)', fontWeight: 800,
      fontSize: size * 0.42, flexShrink: 0,
      border: you ? `2px solid ${accent}` : '1px solid var(--line-2)',
    }}>{(name || '?').charAt(0).toUpperCase()}</span>
  );
}

export function Header({ title, sub, onBack, right }) {
  return (
    <div className="kb-header">
      <div className="kb-row" style={{ gap: 12, minWidth: 0 }}>
        {onBack && (
          <button className="kb-icon-btn" onClick={onBack} aria-label="Atrás">
            <Icon name="chevronL" size={20} />
          </button>
        )}
        <div className="kb-header-title">
          {sub && <span className="kb-eyebrow">{sub}</span>}
          <h1>{title}</h1>
        </div>
      </div>
      {right}
    </div>
  );
}

function TeamPillar({ badge, label }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {badge}
      <span style={{ fontWeight: 600, fontSize: 11.5, lineHeight: 1.15, textAlign: 'center', color: 'var(--text)', maxWidth: '100%' }}>{label}</span>
    </div>
  );
}

export function MatchTeams({ homeBadge, awayBadge, homeLabel, awayLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <TeamPillar badge={homeBadge} label={homeLabel} />
      <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 13, letterSpacing: 0.5, color: 'var(--muted-2)', flexShrink: 0, paddingBottom: 22 }}>VS</span>
      <TeamPillar badge={awayBadge} label={awayLabel} />
    </div>
  );
}

export function StatTile({ icon, tone, big, label }) {
  const toneColor = { gold: 'var(--gold)', green: 'var(--green)', red: 'var(--red)', blue: 'var(--blue)' }[tone];
  const toneBg = { gold: 'rgba(255,201,64,0.12)', green: 'rgba(43,227,107,0.12)', red: 'rgba(255,82,71,0.12)', blue: 'rgba(88,182,255,0.12)' }[tone];
  return (
    <div className="kb-card" style={{ padding: '13px 11px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: toneBg, color: toneColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={17} />
      </span>
      <div>
        <div className="kb-num" style={{ fontSize: 24, lineHeight: 1, color: 'var(--text)' }}>{big}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function BetBubble({ side, grad, textColor, icon, label, onClick }) {
  const offset = 64;
  return (
    <button onClick={onClick} style={{
      position: 'absolute', bottom: 150,
      left: `calc(50% - 36px ${side === 'left' ? '-' : '+'} ${offset}px)`,
      width: 72, height: 72, borderRadius: '50%', border: 'none', cursor: 'pointer',
      background: grad, color: textColor,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      boxShadow: '0 10px 26px rgba(0,0,0,0.5), 0 0 0 5px var(--bg)',
    }}>
      <Icon name={icon} size={24} stroke={2} />
      <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.2 }}>{label}</span>
    </button>
  );
}

export function BottomNav({ active, onNav }) {
  const [open, setOpen] = useState(false);
  const [jors, setJors] = useState(null);
  const [compChoice, setCompChoice] = useState(null);
  useEffect(() => { if (open && !jors) getActiveJornadas().then(setJors).catch(console.error); }, [open, jors]);

  const items = [
    { key: 'inicio', icon: 'home', label: 'Inicio' },
    { key: 'ranking', icon: 'trophy', label: 'Clasificación' },
    { key: 'apostar', fab: true },
    { key: 'historial', icon: 'history', label: 'Historial' },
    { key: 'calendario', icon: 'calendar', label: 'Calendario' },
  ];
  const close = () => { setOpen(false); setCompChoice(null); };
  const chooseComp = (comp) => {
    const list = (jors && jors[comp]) || [];
    if (list.length <= 1) { close(); onNav('apostar', { comp, jornada: list[0] && list[0].jornada }); }
    else setCompChoice(comp);
  };
  const blue = compChoice === 'CL';
  const list = compChoice ? ((jors && jors[compChoice]) || []) : [];

  return (
    <>
      {open && (
        <div onClick={close} style={{ position: 'absolute', inset: 0, zIndex: 7 }}>
          {!compChoice ? (
            <>
              <BetBubble side="left" grad="var(--grad-green)" textColor="#06210F" icon="ball" label="LaLiga"
                onClick={(e) => { e.stopPropagation(); chooseComp('PD'); }} />
              <BetBubble side="right" grad="linear-gradient(118deg,#58B6FF 0%,#7BD0FF 100%)" textColor="#06182A" icon="trophy" label="Champions"
                onClick={(e) => { e.stopPropagation(); chooseComp('CL'); }} />
            </>
          ) : (
            <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 130, left: '50%', transform: 'translateX(-50%)', width: 'min(280px, 84%)', background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', padding: 10 }}>
              <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: blue ? 'var(--blue)' : 'var(--green)', textAlign: 'center', marginBottom: 8 }}>
                {blue ? 'Champions' : 'LaLiga'} · elige jornada
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {list.map((j) => (
                  <button key={j.jornada} onClick={() => { close(); onNav('apostar', { comp: compChoice, jornada: j.jornada }); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '11px 13px', borderRadius: 10, cursor: 'pointer',
                      border: '1px solid ' + (blue ? 'rgba(88,182,255,0.35)' : 'rgba(43,227,107,0.35)'),
                      background: blue ? 'rgba(88,182,255,0.08)' : 'rgba(43,227,107,0.08)', color: 'var(--text)' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{j.label}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{j.count} {j.count === 1 ? 'partido' : 'partidos'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <nav className="kb-nav" style={open ? { zIndex: 8 } : undefined}>
        {items.map((it) => it.fab ? (
          <button key="apostar" className="kb-nav-fab" onClick={() => (open ? close() : setOpen(true))} style={{ position: 'relative', zIndex: 8 }}>
            <span className="ring" style={open ? { transform: 'rotate(45deg)' } : undefined}><Icon name={open ? 'plus' : 'ticket'} size={26} stroke={2} /></span>
            <span className="lbl">Apostar</span>
          </button>
        ) : (
          <button key={it.key} className={'kb-nav-item' + (active === it.key ? ' active' : '')} onClick={() => { close(); onNav(it.key); }}>
            <Icon name={it.icon} size={23} stroke={active === it.key ? 2.1 : 1.8} />
            <span className="lbl">{it.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

/* Estados de carga / vacío / error reutilizables */
export function Loading({ label = 'Cargando…' }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--muted)', padding: 40 }}>
      <span className="kb-spinner" />
      <span style={{ fontSize: 13.5 }}>{label}</span>
    </div>
  );
}

export function EmptyState({ icon = 'info', title, sub }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--muted)', padding: 40, textAlign: 'center' }}>
      <span style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-2)' }}>
        <Icon name={icon} size={26} />
      </span>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  );
}

/* Toggle de filtros tipo "pastilla" reutilizable */
export function FilterPills({ value, onChange, options, accent = 'var(--green)' }) {
  return (
    <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
      {options.map(([k, lbl]) => (
        <button key={k} onClick={() => onChange(k)} style={{
          padding: '7px 14px', borderRadius: 99, cursor: 'pointer',
          border: '1px solid ' + (value === k ? accent : 'var(--line)'),
          background: value === k ? 'rgba(43,227,107,0.12)' : 'var(--surface)',
          color: value === k ? accent : 'var(--muted)',
          fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-ui)',
        }}>{lbl}</button>
      ))}
    </div>
  );
}

export { useState };
