/* ========================= */
/* SISTEMA CAMAS PRO FINAL */
/* ========================= */

let camas = [];

/* ========================= */
/* LEER TABLA */
/* ========================= */
function obtenerCamasDesdeTabla() {
  const filas = document.querySelectorAll("#tablaCamas tr");
  camas = [];

  filas.forEach(fila => {
    const id = fila.cells[0].innerText.trim();
    const servicio = fila.cells[1].innerText.trim();
    const estadoTexto = document.getElementById(`estado-${id}`).innerText.toLowerCase();
    const nivel = fila.cells[3].innerText.trim().toLowerCase();
    const paciente = fila.cells[4].innerText.trim();

    let estado = "disponible";
    if (estadoTexto.includes("ocupada")) estado = "ocupada";
    if (estadoTexto.includes("limpieza")) estado = "limpieza";

    camas.push({ id, servicio, estado, nivel, paciente });
  });
}

/* ========================= */
/* KPIs DINÁMICOS */
/* ========================= */
function actualizarKPIs() {

  const total = camas.length;

  const disponibles = camas.filter(c => c.estado === "disponible").length;
  const ocupadas = camas.filter(c => c.estado === "ocupada").length;
  const limpieza = camas.filter(c => c.estado === "limpieza").length;

  const ocupacion = total ? Math.round((ocupadas / total) * 100) : 0;

  const promedio = ocupadas
    ? (Math.random() * 5 + 2).toFixed(1)
    : 0;

  document.getElementById("kpiDisponibles").innerText = disponibles;
  document.getElementById("kpiOcupadas").innerText = ocupadas;
  document.getElementById("kpiLimpieza").innerText = limpieza;
  document.getElementById("kpiOcupacion").innerText = ocupacion + "%";
  document.getElementById("kpiEstadia").innerText = promedio + " días";
}

/* ========================= */
/* MAPA VISUAL */
/* ========================= */
function renderMapaCamas() {
  const contenedor = document.getElementById("mapaCamas");
  contenedor.innerHTML = "";

  camas.forEach(cama => {

    const div = document.createElement("div");
    div.className = `cama ${cama.estado}`;

    div.setAttribute("data-info",
      `${cama.servicio} | ${cama.estado} | Nivel: ${cama.nivel} | Paciente: ${cama.paciente}`
    );

    div.innerHTML = `
      <div class="cama-id">${cama.id}</div>
      <div class="cama-servicio">${cama.servicio}</div>
    `;

    /* 🔥 SELECCIÓN VISUAL */
    div.addEventListener("click", () => {

      document.querySelectorAll(".cama").forEach(c => c.classList.remove("selected"));
      div.classList.add("selected");

      abrirModalCama(cama);
    });

    contenedor.appendChild(div);
  });

  actualizarKPIs();
}

/* ========================= */
/* BOTÓN GESTIONAR */
/* ========================= */
function gestionarCama(id) {
  const cama = camas.find(c => c.id === id);
  if (!cama) return;
  abrirModalCama(cama);
}

/* ========================= */
/* MODAL DETALLE */
/* ========================= */
function abrirModalCama(cama) {

  const contenido = `
    <p><strong>ID:</strong> ${cama.id}</p>
    <p><strong>Servicio:</strong> ${cama.servicio}</p>
    <p><strong>Estado:</strong> ${cama.estado}</p>
    <p><strong>Nivel:</strong> ${cama.nivel}</p>
    <p><strong>Paciente:</strong> ${cama.paciente}</p>
  `;

  let acciones = "";

  if (cama.estado === "disponible") {
    acciones += `<button class="btn primary" onclick="abrirModalIngresoGlobal('${cama.id}')">Ingresar paciente</button>`;
  }

  if (cama.estado === "ocupada") {
    acciones += `
      <button class="btn success" onclick="darAlta('${cama.id}')">Dar alta</button>
      <button class="btn warning" onclick="enviarLimpieza('${cama.id}')">Limpieza</button>
    `;
  }

  if (cama.estado === "limpieza") {
    acciones += `
      <button class="btn primary" onclick="marcarDisponible('${cama.id}')">Disponible</button>
    `;
  }

  mostrarModal("Detalle de cama", contenido, acciones);
}

/* ========================= */
/* MODAL UNIVERSAL */
/* ========================= */
function mostrarModal(titulo, contenidoHTML, accionesHTML) {

  let modal = document.getElementById("modalUniversal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modalUniversal";
    modal.className = "modal-overlay";

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modalTitulo"></h3>
          <button class="close-btn" onclick="cerrarModal()">×</button>
        </div>
        <div class="modal-body" id="modalContenido"></div>
        <div class="modal-footer" id="modalAcciones"></div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  document.getElementById("modalTitulo").innerText = titulo;
  document.getElementById("modalContenido").innerHTML = contenidoHTML;
  document.getElementById("modalAcciones").innerHTML = accionesHTML;

  modal.classList.add("active");
}

function cerrarModal() {
  document.getElementById("modalUniversal").classList.remove("active");
}

/* ========================= */
/* NUEVO INGRESO */
/* ========================= */
function abrirModalIngresoGlobal(idPreSeleccionado = null) {

  const disponibles = camas.filter(c => c.estado === "disponible");

  if (disponibles.length === 0) {
    alert("No hay camas disponibles");
    return;
  }

  let opciones = disponibles.map(c => `
    <option value="${c.id}" ${c.id === idPreSeleccionado ? "selected" : ""}>
      Cama ${c.id} - ${c.servicio}
    </option>
  `).join("");

  const contenido = `
    <label>Nombre</label>
    <input id="nombrePaciente" class="form-control">

    <label>Edad</label>
    <input id="edadPaciente" type="number" class="form-control">

    <label>Peso</label>
    <input id="pesoPaciente" type="number" class="form-control">

    <label>Nivel</label>
    <select id="nivelPaciente" class="form-control">
      <option value="baja">Baja</option>
      <option value="media">Media</option>
      <option value="alta">Alta</option>
    </select>

    <label>Cama</label>
    <select id="camaSelect" class="form-control">
      ${opciones}
    </select>
  `;

  const acciones = `
    <button class="btn" onclick="cerrarModal()">Cancelar</button>
    <button class="btn primary" onclick="guardarIngreso()">Guardar</button>
  `;

  mostrarModal("Nuevo ingreso", contenido, acciones);
}

/* ========================= */
/* GUARDAR INGRESO */
/* ========================= */
function guardarIngreso() {

  const nombre = document.getElementById("nombrePaciente").value;
  const edad = document.getElementById("edadPaciente").value;
  const peso = document.getElementById("pesoPaciente").value;
  const nivel = document.getElementById("nivelPaciente").value;
  const id = document.getElementById("camaSelect").value;

  if (!nombre || !edad || !peso) {
    alert("Completa todos los campos");
    return;
  }

  const cama = camas.find(c => c.id === id);

  cama.estado = "ocupada";
  cama.paciente = `${nombre} (${edad} años, ${peso}kg)`;
  cama.nivel = nivel;

  actualizarTabla(cama);
  renderMapaCamas();
  cerrarModal();
}

/* ========================= */
/* ACCIONES */
/* ========================= */
function darAlta(id) {
  const cama = camas.find(c => c.id === id);
  cama.estado = "disponible";
  cama.paciente = "-";

  actualizarTabla(cama);
  renderMapaCamas();
  cerrarModal();
}

function enviarLimpieza(id) {
  const cama = camas.find(c => c.id === id);
  cama.estado = "limpieza";
  cama.paciente = "-";

  actualizarTabla(cama);
  renderMapaCamas();
  cerrarModal();
}

function marcarDisponible(id) {
  const cama = camas.find(c => c.id === id);
  cama.estado = "disponible";

  actualizarTabla(cama);
  renderMapaCamas();
  cerrarModal();
}

/* ========================= */
/* ACTUALIZAR TABLA */
/* ========================= */
function actualizarTabla(cama) {

  const id = cama.id;

  const estadoTag = document.getElementById(`estado-${id}`);
  const pacienteTd = document.getElementById(`paciente-${id}`);
  const btn = document.getElementById(`btn-gestionar-${id}`);

  if (cama.estado === "disponible") {
    estadoTag.className = "tag green";
    estadoTag.innerText = "Disponible";
    btn.style.display = "none";
  }

  if (cama.estado === "ocupada") {
    estadoTag.className = "tag red";
    estadoTag.innerText = "Ocupada";
    btn.style.display = "inline-block";
  }

  if (cama.estado === "limpieza") {
    estadoTag.className = "tag orange";
    estadoTag.innerText = "Limpieza";
    btn.style.display = "none";
  }

  pacienteTd.innerText = cama.paciente;

  const nivelTag = document.querySelector(`#fila-${id} .nivel`);
  nivelTag.className = `nivel ${cama.nivel}`;
  nivelTag.innerText = cama.nivel.charAt(0).toUpperCase() + cama.nivel.slice(1);
}

/* ========================= */
/* INIT */
/* ========================= */
document.addEventListener("DOMContentLoaded", () => {
  obtenerCamasDesdeTabla();
  renderMapaCamas();
});