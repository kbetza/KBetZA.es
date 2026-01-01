/**
 * ============================================
 * AUTH.JS - Módulo de Autenticación
 * ============================================
 */

// URLs de las APIs (Netlify Functions)
const API_URLS = {
  login: '/api/login',
  partidos: '/api/matches',
  enviarApuestas: '/api/predictions',
  verificarApuesta: '/api/check-bet',
  apuestaActual: '/api/current-bet',
  historial: '/api/history',
  clasificacionJugadores: '/api/standings/players',
  clasificacionLiga: '/api/standings/league'
};

// Estado de la aplicación
const AppState = {
  isSubmitting: false
};

function getCurrentUser() {
  return localStorage.getItem('usuario');
}

function checkAuth() {
  const usuario = getCurrentUser();
  if (!usuario) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function updateUserDisplay() {
  const nombreUsuarioEl = document.getElementById('nombre-usuario');
  const usuario = getCurrentUser();
  if (nombreUsuarioEl && usuario) {
    nombreUsuarioEl.textContent = usuario;
  }
}

function handleLogout() {
  localStorage.removeItem('usuario');
  window.location.href = 'index.html';
}

async function handleLogin(event) {
  event.preventDefault();
  
  const usuarioInput = document.getElementById('usuario');
  const contrasenaInput = document.getElementById('contrasena');
  const errorMessage = document.getElementById('error-message');
  const loginBtn = document.getElementById('login-btn');
  
  const usuario = usuarioInput.value.trim();
  const contrasena = contrasenaInput.value.trim();
  
  errorMessage.textContent = '';
  
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando...';
  }
  
  try {
    const response = await fetch(API_URLS.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contrasena })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('usuario', data.usuario || usuario);
      window.location.href = 'lobby.html';
    } else {
      errorMessage.textContent = 'Usuario o contraseña incorrectos.';
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    errorMessage.textContent = 'Error de conexión. Inténtalo más tarde.';
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    return;
  }
  
  if (!checkAuth()) return;
  
  updateUserDisplay();
  
  const cerrarSesionBtn = document.getElementById('cerrar-sesion');
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', handleLogout);
  }
});

window.API_URLS = API_URLS;
window.AppState = AppState;
window.getCurrentUser = getCurrentUser;
