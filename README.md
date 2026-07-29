# KBetZA 2026 — App

La quiniela de KBetZA (LaLiga). **Arquitectura: app estática ↔ Supabase, sin capa intermedia.**

La app (React + Vite, PWA) habla directamente con Supabase mediante `@supabase/supabase-js`.
La lógica sensible (login, envío de apuestas) vive en **funciones RPC de Postgres**; el resto
son lecturas con RLS de lectura pública. Se despliega como sitio estático en **Netlify**.

```
┌─────────────────────┐        supabase-js         ┌──────────────────────────┐
│  App React (Vite)   │ ─────────────────────────► │  Supabase (frclhxra…)    │
│  PWA · Netlify      │   select (RLS público)     │  · tablas de juego        │
│                     │   rpc login / submit       │  · RPC login()            │
└─────────────────────┘                            │  · RPC submit_predictions │
                                                    │  · vista league_standings │
                                                    └──────────────────────────┘
```

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
```

Variables en `.env` (la clave anon es pública por diseño; la seguridad la dan RLS + RPC):

```
VITE_SUPABASE_URL=https://frclhxrafeadebmuikjr.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

## Build y despliegue (Netlify)

```bash
npm run build      # genera dist/
```

`netlify.toml` ya está configurado: `build = npm run build`, `publish = dist`, fallback SPA.
En Netlify, define las mismas variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
en *Site settings → Environment variables* (se incrustan en el build).

## Estructura

```
src/
  lib/
    supabase.js     Cliente Supabase
    api.js          Toda la comunicación con la BD (login, partidos, apuestas, clasificaciones, historial)
    teams.js        Mapa id→equipo + escudos
    format.js       Formato español (coma decimal, fechas)
  context/AuthContext.jsx   Sesión (usuario en localStorage)
  components/       Icon, ui (Header, BottomNav, TeamLogo, MatchTeams, podio, etc.)
  screens/          Login, Home, Bet, MyBet, Ranking, History, Calendar
  App.jsx           Router por estado + shell responsive (móvil / escritorio)
public/assets/teams 20 escudos LaLiga por id de football-data.org
```

## Backend (Supabase) — añadido para esta app

- Tabla `users` (RLS cerrada) + RPC `login(p_username, p_password)` — bcrypt vía pgcrypto;
  los hashes nunca salen al cliente. 26 jugadores de KBetZA sembrados.
- RPC `submit_predictions(p_username, p_jornada, p_bets jsonb)` — valida que no haya apostado
  ya e inserta la quiniela en `current_predictions`.
- Vista `league_standings` — clasificación de equipos calculada en vivo desde `all_matches`.

Tablas y funciones de juego preexistentes (jornada, histórico, puntos, clasificación de jugadores)
se reutilizan tal cual.

## Alcance actual

Solo **LaLiga** (lo que soporta la BD hoy). Champions y Tablón del prototipo quedan para una
fase posterior (requieren tablas nuevas).
