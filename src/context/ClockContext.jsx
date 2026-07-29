import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getReferenceDate, setReferenceDate, clearReferenceDate } from '../lib/api.js';

/* Reloj de la app: usa la fecha simulada (reference_date) si está puesta, si no la real.
   Sirve para validar una temporada ya jugada recorriéndola por fechas. */
const ClockContext = createContext(null);

export function ClockProvider({ children }) {
  const [refMs, setRefMs] = useState(null);   // ms de la fecha simulada, o null = tiempo real
  const [loaded, setLoaded] = useState(false);
  const mountReal = useRef(Date.now());

  useEffect(() => {
    getReferenceDate()
      .then((iso) => setRefMs(iso ? Date.parse(iso) : null))
      .catch(() => setRefMs(null))
      .finally(() => setLoaded(true));
  }, []);

  const now = useCallback(
    () => (refMs != null ? refMs + (Date.now() - mountReal.current) : Date.now()),
    [refMs]
  );

  const applyRef = useCallback(async (iso) => {
    if (iso) await setReferenceDate(iso); else await clearReferenceDate();
    window.location.reload(); // recargar: las vistas se recalculan con el nuevo reloj
  }, []);

  if (!loaded) return null;

  return (
    <ClockContext.Provider value={{ now, refMs, isSim: refMs != null, applyRef }}>
      {children}
    </ClockContext.Provider>
  );
}

export const useClock = () => useContext(ClockContext);
