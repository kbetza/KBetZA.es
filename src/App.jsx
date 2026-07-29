import { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { LoginScreen } from './screens/Login.jsx';
import { HomeScreen } from './screens/Home.jsx';
import { BetScreen } from './screens/Bet.jsx';
import { MyBetScreen } from './screens/MyBet.jsx';
import { RankingScreen } from './screens/Ranking.jsx';
import { HistoryScreen } from './screens/History.jsx';
import { CalendarScreen } from './screens/Calendar.jsx';

export default function App() {
  const { user } = useAuth();
  const [route, setRoute] = useState({ name: 'inicio', params: {} });

  if (!user) return <Shell><LoginScreen /></Shell>;

  const nav = (name, params = {}) => setRoute({ name, params });
  const p = route.params || {};
  let screen;
  switch (route.name) {
    case 'apostar':    screen = <BetScreen comp={p.comp || 'PD'} jornada={p.jornada} onBack={() => (p.from === 'miapuesta' ? nav('miapuesta', { comp: p.comp, jornada: p.jornada }) : nav('inicio'))} onNav={nav} />; break;
    case 'miapuesta':  screen = <MyBetScreen comp={p.comp || 'PD'} jornada={p.jornada} onNav={nav} />; break;
    case 'ranking':    screen = <RankingScreen onNav={nav} />; break;
    case 'historial':  screen = <HistoryScreen onNav={nav} />; break;
    case 'calendario': screen = <CalendarScreen onNav={nav} />; break;
    default:           screen = <HomeScreen onNav={nav} />;
  }
  const key = `${route.name}-${p.comp || ''}-${p.jornada || ''}`;
  return <Shell key={key}>{screen}</Shell>;
}

function Shell({ children }) {
  return (
    <div className="kb-stage">
      <div className="kb-frame">{children}</div>
    </div>
  );
}
