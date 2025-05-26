// Script para login.html
document.addEventListener('DOMContentLoaded', function () 
{
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

if (tablaContainer && loadingContainer && tablaBody) 
  {
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
    const tablaApuestas = document.getElementById('tabla-apuestas');
    const tablaCuerpo = document.getElementById('bodyRows');
    const numJornada = document.getElementById('num-jornada');

if (tablaApuestas && numJornada && tablaCuerpo && loadingContainer) 
  {
    const apiUrl = 'https://script.google.com/macros/s/AKfycbx1nw6XuGGaFbFcMUMUdPJxhR2TqcEPzQjp_W9sB4XZtZGghRNvNA0HjZhjRQSmHpoQ/exec';

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => 
        {
        if (!Array.isArray(data)) throw new Error("Formato de datos incorrecto");
        
      

        data.forEach((partido, index) => {
          const tr = document.createElement('tr');

          const tdFecha = document.createElement('td');
          tdFecha.textContent = new Date(partido.Fecha).toLocaleDateString('es-ES');
          tr.appendChild(tdFecha);

          const tdHora = document.createElement('td');
          tdHora.textContent = new Date(partido.Hora).toLocaleTimeString('es-ES', 
          {
          hour: '2-digit',
          minute: '2-digit'
          });
          tr.appendChild(tdHora);

          const tdEquipo_Local = document.createElement('td');
          tdEquipo_Local.textContent = partido.Equipo_Local;
          tr.appendChild(tdEquipo_Local);

          const tdVisitante = document.createElement('td');
          tdVisitante.textContent = partido.Equipo_Visitante;
          tr.appendChild(tdVisitante);

          const tdApuesta = document.createElement('td');
          ['1', 'X', '2'].forEach((opcion) => {
          const label = document.createElement('label');
          label.style.marginRight = '10px';

          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = `apuesta-${index}`; // Agrupa radios por fila
          radio.value = opcion;
  
          label.appendChild(radio);
          label.appendChild(document.createTextNode(` ${opcion}`));
          tdApuesta.appendChild(label);
          });
        tr.appendChild(tdApuesta);
              // ID Local (oculto)
          const tdIDLocal = document.createElement('td');
          tdIDLocal.textContent = partido.ID_Local;
          tdIDLocal.style.display = 'none';
          tdIDLocal.classList.add('id-local');
          tr.appendChild(tdIDLocal);
  
          // ID Visitante (oculto)
          const tdIDVisitante = document.createElement('td');
          tdIDVisitante.textContent = partido.ID_Visitante;
          tdIDVisitante.style.display = 'none';
          tdIDVisitante.classList.add('id-visitante');
          tr.appendChild(tdIDVisitante);

          // JORNADA (oculto)
          const tdJornada = document.createElement('td');
          tdJornada.textContent = partido.Jornada.replace('Regular Season - ', '');
          numJornada.textContent =  ("J." + tdJornada.textContent);
          tdJornada.style.display = 'none';
          tdJornada.classList.add('jornada');
          tr.appendChild(tdJornada);
        tablaCuerpo.appendChild(tr);
        });    
        loadingContainer.style.display = 'none';
        tablaApuestas.style.display = 'block';
      })
      .catch(error => {
        console.error('Error cargando datos:', error);
        loadingContainer.innerHTML = "<p style='color:red;'>Error cargando los partidos.</p>";
      });
  }

});

// ###############################################################################################################################






// ###############################################################################################################################

 // Script para enviar apuestas
document.getElementById('enviar-apuestas').addEventListener('click', () => {
  const filas = document.querySelectorAll('#bodyRows tr');
  const datosEnviar = [];
  const ahora = new Date();
  const fechaDia = ahora.toLocaleDateString();
  const fechaHora = ahora.toLocaleTimeString();

  let apuestasIncompletas = false;

  filas.forEach((fila) => {
    const radios = fila.querySelectorAll('input[type="radio"]');
    let pronostico = "";

    radios.forEach(radio => {
      if (radio.checked) pronostico = radio.value;
    });

    if (!pronostico) {
      apuestasIncompletas = true; // Se encontró una fila sin apuesta
    } else {
      const idLocal = fila.querySelector('.id-local').textContent.trim();
      const idVisitante = fila.querySelector('.id-visitante').textContent.trim();
      const idpartido = idLocal + idVisitante;

      const nombreUsuario = document.getElementById('nombre-usuario').textContent;
      const jornada = fila.querySelector('.jornada').textContent.trim();
      datosEnviar.push({
        jugador: nombreUsuario,
        jornada: jornada,
        idpartido: idpartido,
        pronostico: pronostico,
        acierto: "",
        dia: fechaDia, 
        hora: fechaHora
      });
    }
  });

  if (apuestasIncompletas) {
    alert("Debes seleccionar un resultado en todos los partidos antes de enviar la apuesta.");
    return;
  }

  const url = "https://script.google.com/macros/s/AKfycbyzYjaAuTdr0fB2SkZWgp91Hsb3eNBtaP8IdY2Xgic4DKsqt2cp62Ave2k5rpkgk-CsUA/exec";

  fetch(url, {
    method: "POST",
    mode: 'no-cors',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datosEnviar)
  })
    .then(() => {
      alert("¡Apuestas enviadas correctamente!");
    })
    .catch(error => {
      console.error("Error al enviar los datos:", error);
      alert("Error al enviar las apuestas. Inténtalo más tarde.");
    });
});


// #####################################################################################################################################




  
