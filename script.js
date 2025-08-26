// Script para login.html
document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const usuario = document.getElementById('usuario').value.trim();
      const contrasena = document.getElementById('contrasena').value.trim();
      const errorMessage = document.getElementById('error-message');

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
      window.location.href = 'index.html';
    }
  }

  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', function () {
      localStorage.removeItem('usuario');
      window.location.href = 'index.html';
    });
  }

  // ###########################################################################################################
  // CLASIFICACION
  const tablaContainer = document.getElementById('tabla-container');
  const loadingContainer = document.getElementById('loading-container');
  const tablaBody = document.getElementById('bodyRows');

  if (tablaContainer && loadingContainer && tablaBody) {
    const apiUrl = 'https://script.google.com/macros/s/AKfycbyNi3iEK0-l8wwAG3snYs1EMT__EaI1T9UeRR07G_m3Je4DiJfYc0ioubEgi2iyvsjAkQ/exec';

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        data.sort((a, b) => parseFloat(b["Puntos ganados"]) - parseFloat(a["Puntos ganados"]));

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

          ["Jugador", "Puntos ganados", "Aciertos", "Apuestas realizadas"].forEach(key => {
            const td = document.createElement('td');
            if (key === "Puntos ganados" && !isNaN(row[key])) {
              td.textContent = parseFloat(row[key]).toFixed(2);
            } else {
              td.textContent = row[key];
            }
            tr.appendChild(td);
          });

          tablaBody.appendChild(tr);
        });

        loadingContainer.style.display = 'none';
        tablaContainer.style.display = 'block';
      })
      .catch(error => {
        console.error('Error cargando datos:', error);
        loadingContainer.innerHTML = "<p style='color:red;'>Error cargando la clasificación.</p>";
      });
  }

  // ###########################################################################################################
  // APUESTAS
  const tablaApuestas = document.getElementById('tabla-apuestas');
  const tablaCuerpo = document.getElementById('bodyRows');
  const numJornada = document.getElementById('num-jornada');

  if (tablaApuestas && numJornada && tablaCuerpo && loadingContainer) {
    const apiUrl = 'https://script.google.com/macros/s/AKfycbySRZVi7MrQhU9gKAl1dRCzU3mNh7QSHFHDzh1UWPHHgMG9jDsHNpybWMzyKjkRzxfH/exec';

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        if (!Array.isArray(data)) throw new Error("Formato de datos incorrecto");

        const jornadaActual = data[0].Jornada.replace("Regular season - ", "").trim();
        numJornada.textContent = "JORNADA " + jornadaActual;

        const usuarioLogeado = localStorage.getItem("usuario");

        // 🔍 Verificar si ya existe apuesta
        return fetch("https://script.google.com/macros/s/AKfycbzLqwPQfamMyMLxOZXdn-aCaHLktkG4k7a6ssAR4DFypZr2juDSVw3BSgzxJ4EDOS9VRQ/exec")
          .then(res => res.json())
          .then(registros => {
            const yaExiste = registros.some(r =>
              r.jugador.toString().trim().toLowerCase() === usuarioLogeado.toLowerCase() &&
              r.jornada.toString().trim() === jornadaActual
            );

            if (yaExiste) {
              alert("Ya has enviado tu apuesta para la jornada " + jornadaActual);
              window.location.href = 'lobby.html';
              return;
            }

            // Si no existe → pinta los partidos
            data.forEach((partido, index) => {
              const tr = document.createElement('tr');

              const tdFecha = document.createElement('td');
              tdFecha.textContent = new Date(partido.Fecha).toLocaleDateString('es-ES');
              tr.appendChild(tdFecha);

              const tdHora = document.createElement('td');
              tdHora.textContent = new Date(partido.Hora).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              });
              tr.appendChild(tdHora);

              const tdEquipo_Local = document.createElement('td');
              const imgLocal = document.createElement('img');
              imgLocal.src = `logos/${partido.ID_Local}.png`;
              imgLocal.alt = partido.Equipo_Local;
              imgLocal.title = partido.Equipo_Local;
              imgLocal.style.height = '40px';
              tdEquipo_Local.appendChild(imgLocal);
              tr.appendChild(tdEquipo_Local);

              const tdVisitante = document.createElement('td');
              const imgVisitante = document.createElement('img');
              imgVisitante.src = `logos/${partido.ID_Visitante}.png`;
              imgVisitante.alt = partido.Equipo_Visitante;
              imgVisitante.title = partido.Equipo_Visitante;
              imgVisitante.style.height = '40px';
              tdVisitante.appendChild(imgVisitante);
              tr.appendChild(tdVisitante);

              const spanLocal = document.createElement('span');
              spanLocal.textContent = partido.Equipo_Local;
              spanLocal.classList.add('nombre-local');
              spanLocal.style.display = 'block';
              tdEquipo_Local.appendChild(spanLocal);

              const spanVisitante = document.createElement('span');
              spanVisitante.textContent = partido.Equipo_Visitante;
              spanVisitante.classList.add('nombre-visitante');
              spanVisitante.style.display = 'block';
              tdVisitante.appendChild(spanVisitante);

              const tdApuesta = document.createElement('td');
              ['1', 'X', '2'].forEach((opcion) => {
                const label = document.createElement('label');
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `apuesta-${index}`;
                radio.value = opcion;
                radio.setAttribute('data-cuota',
                  opcion === '1' ? partido.Cuota_Local :
                    opcion === 'X' ? partido.Cuota_Empate :
                      partido.Cuota_Visitante
                );
                label.appendChild(radio);
                label.appendChild(document.createTextNode(opcion));
                tdApuesta.appendChild(label);
              });
              tr.appendChild(tdApuesta);

              const tdJornada = document.createElement('td');
              tdJornada.textContent = jornadaActual;
              tdJornada.style.display = 'none';
              tdJornada.classList.add('jornada');
              tr.appendChild(tdJornada);

              tablaCuerpo.appendChild(tr);
            });

            loadingContainer.style.display = 'none';
            tablaApuestas.style.display = 'block';
          });
      })
      .catch(error => {
        console.error('Error cargando datos:', error);
        loadingContainer.innerHTML = "<p style='color:red;'>Error cargando los partidos.</p>";
      });
  }
});

// #####################################################################################################################################
// ENVIAR APUESTAS
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
    let cuotaSeleccionada = "";
    radios.forEach(radio => {
      if (radio.checked) {
        pronostico = radio.value;
        cuotaSeleccionada = radio.getAttribute('data-cuota');
      }
    });

    if (!pronostico) {
      apuestasIncompletas = true;
    } else {
      const nombreLocal = fila.querySelector('.nombre-local').textContent.trim();
      const nombreVisitante = fila.querySelector('.nombre-visitante').textContent.trim();
      const nombreUsuario = localStorage.getItem('usuario');
      const jornada = fila.querySelector('.jornada').textContent.trim();

      datosEnviar.push({
        jugador: nombreUsuario,
        jornada: jornada,
        equipo_Local: nombreLocal,
        equipo_Visitante: nombreVisitante,
        pronostico: pronostico,
        acierto: "",
        dia: fechaDia,
        hora: fechaHora,
        cuota: cuotaSeleccionada
      });
    }
  });

  if (apuestasIncompletas) {
    alert("Debes seleccionar un resultado en todos los partidos antes de enviar la apuesta.");
    return;
  }

  const url = "https://script.google.com/macros/s/AKfycbzLqwPQfamMyMLxOZXdn-aCaHLktkG4k7a6ssAR4DFypZr2juDSVw3BSgzxJ4EDOS9VRQ/exec";

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
      window.location.href = 'lobby.html';
    })
    .catch(error => {
      console.error("Error al enviar los datos:", error);
      alert("Error al enviar las apuestas. Inténtalo más tarde.");
    });
});
