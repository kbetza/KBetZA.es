/* Tablón de anuncios de KBetZA — preview (Inicio) + chat a pantalla completa */
import { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon.jsx';
import { Header } from './ui.jsx';
import { fmtPts, TZ } from '../lib/format.js';

const NAME_COLORS = ['#FFC940', '#58B6FF', '#9C7BFF', '#FF8FA3', '#8BEF4E', '#5EE6C0', '#F4A261'];
function nameColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
}

// "2026-06-13T10:38:00Z" -> "Hoy · 12:38" / "Ayer · 22:14" / "11 jun · 09:30"
// Siempre en hora peninsular, no en la del dispositivo: la peña queda a una hora
// concreta y un mensaje debe leerse igual desde cualquier sitio.
const dfMsgHora  = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dfMsgFecha = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, day: 'numeric', month: 'short' });
const dfMsgDia   = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

function fmtTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const hm = dfMsgHora.format(d);
  const now = new Date();
  const dia = dfMsgDia.format(d);
  if (dia === dfMsgDia.format(now)) return `Hoy · ${hm}`;
  if (dia === dfMsgDia.format(new Date(now.getTime() - 86400000))) return `Ayer · ${hm}`;
  return `${dfMsgFecha.format(d)} · ${hm}`;
}

export function ChatBubble({ msg, me }) {
  const mine = msg.username === me;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
      {!mine && (
        <span style={{ fontSize: 11.5, fontWeight: 700, color: nameColor(msg.display_name), margin: '0 0 4px 13px' }}>
          {msg.display_name}
        </span>
      )}
      <div style={{
        maxWidth: '80%',
        background: mine ? 'var(--grad-green)' : 'var(--surface-2)',
        color: mine ? '#06210F' : 'var(--text)',
        border: mine ? 'none' : '1px solid var(--line)',
        borderRadius: mine ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
        padding: '9px 13px 7px',
      }}>
        <div style={{ fontSize: 14, lineHeight: 1.4 }}>{msg.text}</div>
        <div style={{ fontSize: 10, textAlign: 'right', marginTop: 3, color: mine ? 'rgba(6,33,15,0.6)' : 'var(--muted-2)' }}>{fmtTime(msg.created_at)}</div>
      </div>
    </div>
  );
}

// Anuncio del sistema (p. ej. Top 3 de la jornada) — tarjeta destacada
export function AnnouncementCard({ msg }) {
  const m = msg.meta || {};
  const top = Array.isArray(m.top) ? m.top : null;
  const medal = ['🥇', '🥈', '🥉'];
  return (
    <div style={{ alignSelf: 'stretch', borderRadius: 16, border: '1px solid rgba(255,201,64,0.40)', background: 'linear-gradient(180deg, rgba(255,201,64,0.10), rgba(255,201,64,0.03))', padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: top ? 11 : 6 }}>
        <span style={{ color: 'var(--gold)', display: 'flex' }}><Icon name="trophy" size={17} /></span>
        <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--gold)' }}>
          Top 3{m.comp_label ? ' · ' + m.comp_label : ''}{m.label ? ' · ' + m.label : ''}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted-2)' }}>{fmtTime(msg.created_at)}</span>
      </div>
      {top ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {top.map((p, i) => (
            <div key={p.username || i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{medal[i] || '•'}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: i === 0 ? 'var(--gold)' : 'var(--text)' }}>{p.name}</span>
              <span className="kb-num" style={{ fontSize: 14, color: i === 0 ? 'var(--gold)' : 'var(--muted)' }}>{fmtPts(p.puntos)}</span>
              <span style={{ fontSize: 10.5, color: 'var(--muted-2)' }}>pts</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.4 }}>{msg.text}</div>
      )}
    </div>
  );
}

// Elige entre burbuja de chat y tarjeta de anuncio
export function MessageItem({ msg, me }) {
  return msg.kind === 'anuncio' ? <AnnouncementCard msg={msg} /> : <ChatBubble msg={msg} me={me} />;
}

export function TablonPreview({ messages, unread, me, onOpen }) {
  const last3 = messages.slice(-3);
  return (
    <>
      <div className="kb-between" style={{ marginBottom: 12, gap: 10 }}>
        <h2 className="kb-section-title">Tablón de anuncios</h2>
        {unread > 0 && (
          <span className="kb-pill green" style={{ fontSize: 11, padding: '4px 9px', flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            {unread} sin leer
          </span>
        )}
      </div>
      {last3.length === 0 ? (
        <p style={{ color: 'var(--muted-2)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Aún no hay mensajes. ¡Rompe el hielo!</p>
      ) : (
        <div onClick={onOpen} style={{ display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer' }}>
          {last3.map((m) => <MessageItem key={m.id} msg={m} me={me} />)}
        </div>
      )}
      <button onClick={onOpen} style={{
        width: '100%', marginTop: 14, padding: '12px', cursor: 'pointer',
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
        color: 'var(--green)', fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <Icon name="chat" size={17} /> Abrir el tablón completo
      </button>
    </>
  );
}

export function TablonScreen({ messages, me, onSend, onClose }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try { await onSend(t); setText(''); } finally { setBusy(false); }
  };

  return (
    <div className="kb-app" style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
      <Header title="Tablón" sub="KBetZA habla" right={
        <button className="kb-icon-btn" onClick={onClose} aria-label="Cerrar tablón"><Icon name="collapse" size={18} /></button>
      } />
      <div className="kb-scroll" ref={scrollRef} style={{ padding: '8px 16px 14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m) => <MessageItem key={m.id} msg={m} me={me} />)}
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, padding: '10px 16px calc(env(safe-area-inset-bottom,0px) + 18px)', borderTop: '1px solid var(--line)', background: 'var(--bg)' }}>
        <div className="kb-card" style={{ padding: '8px 8px 8px 14px', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 999 }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Escribe en el tablón…" maxLength={500}
            style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 14.5 }} />
          <button onClick={submit} aria-label="Enviar" disabled={!text.trim() || busy} style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0, border: 'none', cursor: text.trim() ? 'pointer' : 'default',
            background: text.trim() ? 'var(--grad-green)' : 'var(--surface-3)', color: text.trim() ? '#06210F' : 'var(--muted-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          }}><Icon name="send" size={18} stroke={2} /></button>
        </div>
      </div>
    </div>
  );
}
