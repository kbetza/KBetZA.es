import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Wordmark } from '../components/ui.jsx';
import { login as apiLogin } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!user.trim() || !pass) { setError('Introduce usuario y contraseña.'); return; }
    setBusy(true);
    try {
      const u = await apiLogin(user.trim(), pass);
      if (u) signIn(u);
      else setError('Usuario o contraseña incorrectos.');
    } catch (err) {
      console.error(err);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kb-app">
      <div className="kb-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        <form onSubmit={submit} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 26px', minHeight: '100%' }}>
          {/* Marca */}
          <div style={{ textAlign: 'center', marginBottom: 38 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 22 }}>
              <span style={{ position: 'absolute', inset: -22, borderRadius: '50%', background: 'radial-gradient(circle, var(--green-glow), transparent 70%)', filter: 'blur(6px)' }} />
              <span style={{ position: 'relative', width: 92, height: 92, borderRadius: 26, background: 'var(--surface)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)' }}>
                <span style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--grad-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06210F' }}>
                  <Icon name="ball" size={36} stroke={2} />
                </span>
              </span>
            </div>
            <div style={{ marginBottom: 8 }}><Wordmark size={40} /></div>
            <p className="kb-eyebrow" style={{ letterSpacing: 3 }}>La quiniela de KBetZA</p>
          </div>

          {/* Formulario */}
          <div className="kb-input-wrap" style={{ marginBottom: 12 }}>
            <span className="kb-input-icon"><Icon name="atUser" size={20} /></span>
            <input className="kb-input" value={user} onChange={(e) => setUser(e.target.value)} placeholder="Usuario" autoCapitalize="none" autoCorrect="off" />
          </div>
          <div className="kb-input-wrap" style={{ marginBottom: 16 }}>
            <span className="kb-input-icon"><Icon name="lock" size={20} /></span>
            <input className="kb-input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Contraseña" />
          </div>

          {error && <p style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', margin: '0 0 14px' }}>{error}</p>}

          <button className="kb-btn" type="submit" disabled={busy}>
            {busy ? 'Entrando…' : <>Entrar <Icon name="chevronR" size={20} stroke={2.4} /></>}
          </button>
          <p style={{ textAlign: 'center', color: 'var(--muted-2)', fontSize: 12.5, marginTop: 18 }}>
            KBetZA de los sábados · 2025-26
          </p>
        </form>
      </div>
    </div>
  );
}
