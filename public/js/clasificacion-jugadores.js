/**
 * ============================================
 * CLASIFICACION-JUGADORES.JS - PREMIUM PODIUM VERSION
 * ============================================
 * Carga y muestra la clasificación con podio destacado
 * ACTUALIZADO: Soporte para filtros (Temporada, Última Jornada, Partidos de Vuelta)
 */

// Estado actual del filtro
let currentFilter = 'season';

document.addEventListener('DOMContentLoaded', () => {
  // Esperar un momento para asegurar que auth.js haya cargado
  setTimeout(() => {
    initFilterButtons();
    loadClasificacionJugadores(currentFilter);
  }, 100);
});

/**
 * Inicializa los botones de filtro
 */
function initFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      
      if (filter === currentFilter) return;
      
      // Actualizar estado visual de los botones
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Cargar nueva clasificación
      currentFilter = filter;
      loadClasificacionJugadores(filter);
    });
  });
}

/**
 * Carga los datos de clasificación de jugadores con filtro
 */
async function loadClasificacionJugadores(filter = 'season') {
  const loadingContainer = document.getElementById('loading-container');
  const podiumSection = document.getElementById('podium-section');
  const restSection = document.getElementById('rest-section');
  const playersList = document.getElementById('players-list');
  const filterSubtitle = document.getElementById('filter-subtitle');
  
  // Mostrar loading y ocultar contenido
  loadingContainer.classList.remove('hidden');
  podiumSection.classList.add('hidden');
  restSection.classList.add('hidden');
  
  // Limpiar lista anterior
  playersList.innerHTML = '';
  
  // Resetear podio
  resetPodium();
  
  // Verificar que API_URLS existe
  if (typeof API_URLS === 'undefined' || !API_URLS.clasificacionJugadores) {
    console.error('API_URLS no está definido');
    loadingContainer.innerHTML = `
      <p style="color: #ef5350;">Error: API no disponible.</p>
      <button class="btn-back" onclick="location.reload()" style="margin-top: 1rem;">Reintentar</button>
    `;
    return;
  }
  
  try {
    // Construir URL con filtro
    const url = `${API_URLS.clasificacionJugadores}?filter=${filter}`;
    console.log('Fetching clasificación desde:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('Datos recibidos:', responseData);
    
    // Manejar tanto formato nuevo (con filter y standings) como formato antiguo (array directo)
    let data;
    let filterInfo;
    
    if (responseData.standings) {
      // Nuevo formato
      data = responseData.standings;
      filterInfo = responseData.filter;
    } else if (Array.isArray(responseData)) {
      // Formato antiguo (compatibilidad)
      data = responseData;
      filterInfo = { type: filter, description: getDefaultDescription(filter) };
    } else {
      data = [];
      filterInfo = { type: filter, description: getDefaultDescription(filter) };
    }
    
    // Actualizar subtítulo
    if (filterSubtitle && filterInfo) {
      filterSubtitle.textContent = filterInfo.description || getDefaultDescription(filter);
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      loadingContainer.innerHTML = `
        <p style="color: rgba(255,255,255,0.7);">No hay datos de clasificación disponibles para este filtro.</p>
        <a href="lobby.html" class="btn-back" style="margin-top: 1rem;">Volver</a>
      `;
      return;
    }
    
    // Ordenar por puntos descendente
    data.sort((a, b) => parseFloat(b["Puntos ganados"]) - parseFloat(a["Puntos ganados"]));
    
    // Populate Top 3 (Podium)
    const top3 = data.slice(0, 3);
    top3.forEach((player, index) => {
      const position = index + 1;
      const name = player["Jugador"] || 'Jugador';
      const points = parseFloat(player["Puntos ganados"]) || 0;
      const hits = player["Aciertos"] || 0;
      
      // Set avatar letter
      const avatarEl = document.getElementById(`avatar-${position}`);
      if (avatarEl) {
        avatarEl.textContent = name.charAt(0).toUpperCase();
      }
      
      // Set name
      const nameEl = document.getElementById(`name-${position}`);
      if (nameEl) {
        nameEl.textContent = name;
      }
      
      // Set points
      const pointsEl = document.getElementById(`points-${position}`);
      if (pointsEl) {
        pointsEl.textContent = formatPoints(points);
      }
      
      // Set hits
      const hitsEl = document.getElementById(`hits-${position}`);
      if (hitsEl) {
        hitsEl.textContent = hits;
      }
    });
    
    // Populate rest of players (4th onwards)
    const restPlayers = data.slice(3);
    restPlayers.forEach((player, index) => {
      const position = index + 4;
      const name = player["Jugador"] || 'Jugador';
      const points = parseFloat(player["Puntos ganados"]) || 0;
      const hits = player["Aciertos"] || 0;
      const bets = player["Apuestas realizadas"] || 0;
      
      const playerRow = createPlayerRow(position, name, points, hits, bets, filter);
      playersList.appendChild(playerRow);
    });
    
    // Show sections with animation
    loadingContainer.classList.add('hidden');
    podiumSection.classList.remove('hidden');
    
    if (restPlayers.length > 0) {
      restSection.classList.remove('hidden');
    }
    
  } catch (error) {
    console.error('Error cargando clasificación:', error);
    loadingContainer.innerHTML = `
      <p style="color: #ef5350;">Error cargando la clasificación.</p>
      <button class="btn-back" onclick="location.reload()" style="margin-top: 1rem;">Reintentar</button>
    `;
  }
}

/**
 * Resetea el podio a valores por defecto
 */
function resetPodium() {
  for (let i = 1; i <= 3; i++) {
    const avatarEl = document.getElementById(`avatar-${i}`);
    const nameEl = document.getElementById(`name-${i}`);
    const pointsEl = document.getElementById(`points-${i}`);
    const hitsEl = document.getElementById(`hits-${i}`);
    
    if (avatarEl) avatarEl.textContent = '-';
    if (nameEl) nameEl.textContent = '-';
    if (pointsEl) pointsEl.textContent = '0';
    if (hitsEl) hitsEl.textContent = '0';
  }
}

/**
 * Obtiene la descripción por defecto para un filtro
 */
function getDefaultDescription(filter) {
  switch (filter) {
    case 'current':
      return 'Última Jornada';
    case 'second-half':
      return 'Partidos de Vuelta (J20+)';
    case 'season':
    default:
      return 'Temporada 2024-25';
  }
}

/**
 * Creates a player row element for players 4th and beyond
 * NUEVO DISEÑO:
 * - Fila superior: posición + avatar + nombre + puntos (alineado a izquierda, puntos a la derecha)
 * - Debajo: stats alineados a la derecha
 */
function createPlayerRow(position, name, points, hits, bets, filter) {
  const row = document.createElement('div');
  row.className = 'player-row';
  
  // Ajustar la etiqueta de "Jornadas apostadas" según el filtro
  let betsLabel = 'Jornadas apostadas:';
  if (filter === 'current') {
    betsLabel = ''; // No mostrar para jornada actual
  }
  
  row.innerHTML = `
    <div class="player-row-top">
      <div class="player-position">${position}</div>
      <div class="player-avatar-small">${name.charAt(0).toUpperCase()}</div>
      <p class="player-name">${escapeHtml(name)}</p>
      <div class="player-points-badge">${formatPoints(points)}<span class="points-label">pts</span></div>
    </div>
    <div class="player-stats-right">
      <div class="stat-line">Aciertos:<span class="stat-number">${hits}</span></div>
      ${betsLabel ? `<div class="stat-line">${betsLabel}<span class="stat-number">${bets}</span></div>` : ''}
    </div>
  `;
  
  return row;
}

/**
 * Formats points with Spanish decimal separator
 */
function formatPoints(points) {
  return points.toFixed(2).replace('.', ',');
}

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
