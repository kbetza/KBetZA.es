// Script para login.html
document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const usuario = document.getElementById('usuario').value.trim();
      const contrasena = document.getElementById('contrasena').value.trim();
      const errorMessage = document.getElementById('error-message');

      // Limpia mensajes anteriores
      errorMessage.innerText = '';

      try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbx4JvahQC0U2qzE1K5hnCxsbTdn_6v8ctxEweBK-h9O77afi_tT6cONU1kX_zTKqq579g/exec', {
          method: 'POST',
          contentType: 'application/json',
          body: JSON.stringify({ usuario, contrasena }),
        });

        const data = await response.json();

        if (data.success) {
          localStorage.setItem('usuario', usuario);
          window.location.href = 'lobby.html';
        } else {
          errorMessage.innerText = 'Usuario o contraseña incorrectos.';
        }
      } catch (error) {
        console.error('Error al intentar conectar:', error);
        errorMessage.innerText = 'Error de conexión. Inténtalo más tarde.';
      }
    });
  }

  // Script para lobby.html
  const nombreUsuario = document.getElementById('nombre-usuario');
  const cerrarSesionBtn = document.getElementById('cerrar-sesion');

  if (nombreUsuario) {
    const usuario = localStorage.getItem('usuario');

    if (usuario) {
      nombreUsuario.textContent = usuario;
    } else {
      // Redirige si no hay usuario
      window.location.href = 'index.html';
    }
  }

  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', function () {
      localStorage.removeItem('usuario');
      window.location.href = 'index.html';
    });
  }
});
