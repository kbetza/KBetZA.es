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


  
// Script para clasificacion.html con loader y posición
const tablaContainer = document.getElementById('tabla-container');
const loadingContainer = document.getElementById('loading-container');
const tablaBody = document.getElementById('bodyRows');

if (tablaContainer && loadingContainer && tablaBody) {
  const apiUrl = 'https://script.google.com/macros/s/AKfycbwVBBStxQcEfZDMZTyAJMWCPjIgMXbMDqm7_AKPigDO794napZym6M2SCyEBeH1pUhnDg/exec';

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Ordena por aciertos descendente
      data.sort((a, b) => b.Aciertos - a.Aciertos);

      const total = data.length;

      data.forEach((row, index) => {
        const tr = document.createElement('tr');

        if (index === 0) tr.classList.add('fila-oro');
        else if (index === 1) tr.classList.add('fila-plata');
        else if (index === 2) tr.classList.add('fila-bronce');
        else if (index >= total - 3) tr.classList.add('fila-ultima');
        else tr.classList.add('fila-azul');

        const tdPosicion = document.createElement('td');
        tdPosicion.textContent = index + 1;
        tr.appendChild(tdPosicion);

        ['Jugador', 'Aciertos', 'Fallos'].forEach(key => {
          const td = document.createElement('td');
          td.textContent = row[key];
          tr.appendChild(td);
        });

        tablaBody.appendChild(tr);
      });


      // Oculta el loader y muestra la tabla
      loadingContainer.style.display = 'none';
      tablaContainer.style.display = 'block';
    })
    .catch(error => {
      console.error('Error cargando datos:', error);
      loadingContainer.innerHTML = "<p style='color:red;'>Error cargando la clasificación.</p>";
    });
}


});
  