# Quiniela La Liga - Versión Supabase

Sistema de quinielas de La Liga usando Supabase como base de datos.

## 🚀 Cambios respecto a la versión anterior

### Antes (v2)
- Llamadas a la API de football-data.org cada 15 minutos
- Datos de partidos almacenados en archivos JSON
- Scheduled function para actualización automática

### Ahora (v3)
- **Sin llamadas a APIs externas** - Los datos se leen directamente de Supabase
- **Base de datos centralizada** - Todos los datos en tablas de Supabase
- **Sin scheduled functions** - Actualización manual o mediante panel de Supabase

## 📁 Estructura de Imágenes

**IMPORTANTE**: Todas las imágenes (incluyendo logos de equipos) están en la carpeta `/public/imagenes/`:

```
public/
├── imagenes/
│   ├── logo.png           # Logo de la aplicación
│   ├── loading.gif        # Animación de carga
│   ├── btn-apuestas.jpg   # Imagen botón apuestas
│   ├── btn-clasificacion.jpg
│   ├── ... (otros botones)
│   ├── 81.png             # Logo FC Barcelona (ID equipo)
│   ├── 86.png             # Logo Real Madrid (ID equipo)
│   └── ... (otros logos de equipos)
```

Los logos de equipos usan el ID del equipo como nombre de archivo (ej: `81.png` para Barcelona).

## 📦 Configuración

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. Copia la URL del proyecto y la clave anon

### 2. Crear las tablas

Ejecuta los scripts SQL en orden en el **SQL Editor** de Supabase:

```bash
supabase/migrations/001_create_matches_table.sql    # Tablas de partidos y clasificación
supabase/migrations/002_seed_data.sql               # Datos de ejemplo
supabase/migrations/003_create_predictions_tables.sql # Predicciones e historial
```

### 3. Variables de entorno en Netlify

Ve a **Site settings > Environment variables** y añade:

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL de tu proyecto Supabase |
| `SUPABASE_ANON_KEY` | Clave anon (pública) de Supabase |

### 4. Deploy

```bash
# Con Netlify CLI
netlify deploy --prod

# O conecta tu repo de GitHub a Netlify
```

## 📊 Estructura de la Base de Datos

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `matches` | Todos los partidos de la temporada |
| `league_standings` | Clasificación de equipos |
| `predictions` | Apuestas activas (jornada actual) |
| `bet_registry` | Registro para evitar apuestas duplicadas |
| `history` | Historial de apuestas con resultados |
| `player_standings` | Clasificación de jugadores |

### Esquema de `matches`

```sql
id              BIGINT PRIMARY KEY    -- ID del partido
matchday        INTEGER               -- Número de jornada
utc_date        TIMESTAMPTZ           -- Fecha/hora UTC
status          VARCHAR(20)           -- SCHEDULED, FINISHED, etc.
home_team_id    INTEGER               -- ID equipo local
home_team_name  VARCHAR(100)          -- Nombre equipo local
away_team_id    INTEGER               -- ID equipo visitante
away_team_name  VARCHAR(100)          -- Nombre equipo visitante
home_score      INTEGER               -- Goles local (NULL si no jugado)
away_score      INTEGER               -- Goles visitante
result          CHAR(1)               -- '1', 'X', '2' o NULL
odds_home       DECIMAL(5,2)          -- Cuota local
odds_draw       DECIMAL(5,2)          -- Cuota empate
odds_away       DECIMAL(5,2)          -- Cuota visitante
season          VARCHAR(10)           -- '2024' para 2024-25
```

## 🔌 Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/login` | Autenticación |
| GET | `/api/matches` | Partidos de la jornada actual |
| POST | `/api/predictions` | Enviar apuestas |
| GET | `/api/check-bet?jugador=X&jornada=Y` | Verificar si ya apostó |
| GET | `/api/standings/league` | Clasificación de equipos |
| GET | `/api/standings/players` | Clasificación de jugadores |
| GET | `/api/history?jugador=X` | Historial de un jugador |

## 📝 Actualizar datos manualmente

### Desde el panel de Supabase

1. Ve a **Table Editor** en tu proyecto Supabase
2. Selecciona la tabla `matches`
3. Edita los campos necesarios (status, scores, result)

### Mediante SQL

```sql
-- Actualizar resultado de un partido
UPDATE matches 
SET 
    status = 'FINISHED',
    home_score = 2,
    away_score = 1,
    result = '1'
WHERE id = 544371;

-- Actualizar múltiples partidos
UPDATE matches 
SET status = 'FINISHED', home_score = 3, away_score = 0, result = '1'
WHERE id = 544375;
```

### Recalcular clasificación de jugadores

```sql
SELECT update_player_standings();
```

## 🗂️ Estructura del Proyecto

```
quiniela-laliga/
├── netlify.toml              # Configuración Netlify
├── package.json              # Dependencias
│
├── lib/
│   └── supabase.js           # Cliente Supabase con todas las funciones
│
├── netlify/functions/        # Serverless functions
│   ├── login.js
│   ├── matches.js            # Lee de Supabase
│   ├── predictions.js
│   ├── standings-league.js   # Lee de Supabase
│   ├── standings-players.js
│   ├── history.js
│   ├── check-bet.js
│   └── current-bet.js
│
├── scripts/
│   ├── move-logos.sh         # Script para mover logos a imagenes
│   └── ...
│
├── supabase/migrations/      # Scripts SQL
│   ├── 001_create_matches_table.sql
│   ├── 002_seed_data.sql
│   └── 003_create_predictions_tables.sql
│
└── public/                   # Frontend
    ├── index.html
    ├── lobby.html
    ├── js/
    │   ├── apuestas.js       # Usa /imagenes/ para logos
    │   ├── clasificacion-liga.js  # Usa imagenes/ para logos
    │   └── ...
    ├── styles/
    └── imagenes/             # TODAS las imágenes aquí (incluye logos de equipos)
        ├── logo.png
        ├── 81.png            # Logos de equipos por ID
        └── ...
```

## ⚠️ Notas importantes

### Seguridad
- Las claves de Supabase están en variables de entorno del servidor
- RLS (Row Level Security) está habilitado en todas las tablas
- Las políticas permiten lectura pública pero controlan escritura

### Actualización de datos
- **Ya no hay actualización automática** desde football-data.org
- Debes actualizar los partidos manualmente en Supabase
- Puedes crear un cron job externo si necesitas automatización

### Migración de datos existentes
Si tienes datos en el sistema anterior:
1. Exporta el historial y clasificaciones
2. Insértalos en las tablas de Supabase
3. Verifica que los IDs de partidos coincidan

## 🐛 Troubleshooting

### "Error cargando partidos"
- Verifica que las variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén configuradas
- Revisa que la tabla `matches` tenga datos
- Comprueba los logs en Netlify > Functions

### "Supabase connection error"
- Verifica que el proyecto Supabase esté activo
- Comprueba que la URL y key sean correctas
- Revisa las políticas RLS si hay errores de permisos

### "Logo no encontrado"
- Verifica que el archivo `{id_equipo}.png` existe en `/public/imagenes/`
- Los IDs de equipos deben coincidir con los de football-data.org

---

**Migrado a Supabase - Diciembre 2025**
