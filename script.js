document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();
  
    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;
  
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbx4JvahQC0U2qzE1K5hnCxsbTdn_6v8ctxEweBK-h9O77afi_tT6cONU1kX_zTKqq579g/exec', { 
        method: 'POST',
        contentType: 'application/json',
        body: JSON.stringify({ usuario, contrasena }),
      });
  
      const data = await response.json();
  
      if (data.success) {
        window.location.href = 'lobby.html';
      } else {
        document.getElementById('error-message').innerText = 'Usuario o contraseña erróneos.';
      }
    } catch (error) {
      console.error('Error al intentar conectar:', error);
      document.getElementById('error-message').innerText = 'Error de conexión.';
    }
  });
  