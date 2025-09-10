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

        ["Jugador","Puntos ganados", "Aciertos", "Apuestas realizadas"].forEach(key => {
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


      // Oculta el loader y muestra la tabla
      loadingContainer.style.display = 'none';
      tablaContainer.style.display = 'block';
    })
    .catch(error => {
      console.error('Error cargando datos:', error);
      loadingContainer.innerHTML = "<p style='color:red;'>Error cargando la clasificación.</p>";
    });
  }

const tablaContainerLiga = document.getElementById('tabla-containerLiga');
if (tablaContainerLiga && loadingContainer && tablaBody) 
  {
  const apiUrl = 'https://script.google.com/macros/s/AKfycbyfXqPoVpNzDwit9cVH0o_1E60fGL5B5Bx_dt58mw6tRg4jG3_UnJOJaOL2xFJCCcwA/exec';

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
        ["Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "Pts"].forEach(key => {
          const td = document.createElement('td');

          if (key === "Equipo") {
            td.style.textAlign = 'center'; 
            const imagen = document.createElement('img');
            const id = row["id_equipo"];
            imagen.src = `logos/${id}.png`;
            imagen.title = row["Equipo"];
            imagen.alt = row["Equipo"];
            imagen.style.height = '40px';
            imagen.style.objectFit = 'contain';
            imagen.style.marginRight = '8px';
            imagen.style.verticalAlign = 'middle';

            // const nombreEquipo = document.createElement('span');
            // nombreEquipo.textContent = row["Equipo"];
            // nombreEquipo.style.verticalAlign = 'middle';

            td.appendChild(imagen);
            // td.appendChild(nombreEquipo);
          } else {
            td.textContent = row[key];
          }

          tr.appendChild(td);
        });


        tablaBody.appendChild(tr);
      });
      // Oculta el loader y muestra la tabla
      loadingContainer.style.display = 'none';
      tablaContainerLiga.style.display = 'block';
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

              // const tdFecha = document.createElement('td');
              // tdFecha.textContent = new Date(partido.Fecha).toLocaleDateString('es-ES');
              // tr.appendChild(tdFecha);

              // const tdHora = document.createElement('td');
              // tdHora.textContent = new Date(partido.Hora).toLocaleTimeString('es-ES', {
              //   hour: '2-digit',
              //   minute: '2-digit'
              // });
              // tr.appendChild(tdHora);

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
                const cuota = opcion === '1' ? partido.Cuota_Local :
                    opcion === 'X' ? partido.Cuota_Empate :
                      partido.Cuota_Visitante
                radio.setAttribute('data-cuota', cuota);

                const cuotaSpan = document.createElement('div');
                cuotaSpan.textContent = `${cuota}`;
                cuotaSpan.style.fontSize = '0.75rem';
                cuotaSpan.style.color = '#666';

                label.appendChild(radio);
                label.appendChild(document.createTextNode(opcion));
                label.appendChild(cuotaSpan); 
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
              // ID Partido (oculto)
              const tdID_partido = document.createElement('td');
              tdID_partido.textContent = partido.ID_partido;
              tdID_partido.style.display = 'none';
              tdID_partido.classList.add('id-partido');
              tr.appendChild(tdID_partido);

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
    let cuotaSeleccionada = "";
    radios.forEach(radio => {
      if (radio.checked) {
        pronostico = radio.value;
        cuotaSeleccionada = radio.getAttribute('data-cuota').replace('.', ',');
      }
    });


    if (!pronostico) {
      apuestasIncompletas = true; // Se encontró una fila sin apuesta
    } else {
      const idLocal = fila.querySelector('.id-local').textContent.trim();
      const idVisitante = fila.querySelector('.id-visitante').textContent.trim();
      const idpartido = fila.querySelector('.id-partido').textContent.trim(); 
      const nombreLocal = fila.querySelector('.nombre-local').textContent.trim();
      const nombreVisitante = fila.querySelector('.nombre-visitante').textContent.trim();
      console.log(nombreLocal, nombreVisitante);
      const nombreUsuario = document.getElementById('nombre-usuario').textContent;
      const jornada = fila.querySelector('.jornada').textContent.trim();
      jornada.split(' - ')[1]; // Extrae el número de jornada
      datosEnviar.push({
        jugador: nombreUsuario,
        jornada: jornada,
        idpartido: idpartido,
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
      window.location.href = 'lobby.html';
      alert("¡Apuestas enviadas correctamente!");
    
    })
    .catch(error => {
      console.error("Error al enviar los datos:", error);
      alert("Error al enviar las apuestas. Inténtalo más tarde.");
    });
});

// #####################################################################################################################################




