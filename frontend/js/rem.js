let dataGlobal = null;
let chart = null;
let donutChart = null;

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await cargarData();
  configurarPDF();
}

// ===============================
// FETCH JSON
// ===============================
async function cargarData() {
  try {
    const res = await fetch("./data/rem.json");

    if (!res.ok) throw new Error("No se pudo cargar rem.json");

    const data = await res.json();

    if (!data?.niveles?.length) {
      throw new Error("JSON inválido o vacío");
    }

    dataGlobal = data;

    llenarSelector(data.niveles);
    actualizarDashboard(data.niveles[0]);

    console.log("✅ REM cargado correctamente");

  } catch (error) {
    console.error("❌ Error REM:", error);
  }
}

// ===============================
// SELECT
// ===============================
function llenarSelector(niveles) {
  const selector = document.getElementById("selectorNivel");
  if (!selector) return;

  selector.innerHTML = "";

  niveles.forEach(({ codigo, nombre }) => {
    const option = document.createElement("option");
    option.value = codigo;
    option.textContent = nombre;
    selector.appendChild(option);
  });

  selector.addEventListener("change", manejarCambioNivel);
}

function manejarCambioNivel(e) {
  const codigo = Number(e.target.value);
  const nivel = dataGlobal.niveles.find(n => n.codigo === codigo);
  if (!nivel) return;

  actualizarDashboard(nivel);
}

// ===============================
// DASHBOARD
// ===============================
function actualizarDashboard(nivel) {
  if (!nivel?.indicadores) return;

  const i = nivel.indicadores;

  // KPIs con animación
  animarNumero("camasDisponibles", i.dias_cama_disponibles, "%");
  animarNumero("camaOcupadas", i.dias_cama_ocupados);
  animarNumero("diasEstada", i.dias_estada);
  animarNumero("indiceOcupacional", i.indice_ocupacional, "%");

  actualizarNivelCuidado(nivel.nivel_cuidado);
  actualizarGrafico(nivel.egresos || []);
  actualizarGlosas(nivel.glosas || []);

  // DONUT
  if (i.indice_rotacion !== undefined) {
    const porcentaje = Math.min(100, Math.round(i.indice_rotacion * 50));
    actualizarDonut(porcentaje);
  }

  // 🔥 RESUMEN PRO
  renderResumen(i, nivel.egresos || []);
}

// ===============================
// 🔥 ANIMACIÓN NÚMEROS (PRO)
// ===============================
function animarNumero(id, valor, sufijo = "") {
  const el = document.getElementById(id);
  if (!el) return;

  let actual = 0;
  const duracion = 600;
  const incremento = valor / (duracion / 16);

  const anim = setInterval(() => {
    actual += incremento;

    if (actual >= valor) {
      actual = valor;
      clearInterval(anim);
    }

    el.textContent = Math.round(actual) + sufijo;
  }, 16);
}

// ===============================
// NIVEL CUIDADO
// ===============================
function actualizarNivelCuidado(nivel) {
  const el = document.getElementById("nivelCuidado");
  if (!el || !nivel) return;

  el.textContent = nivel.tipo;
  el.className = "nivel-cuidado " + nivel.color;
}

// ===============================
// GRÁFICO
// ===============================
function actualizarGrafico(egresos) {
  const canvas = document.getElementById("graficoEgresos");
  if (!canvas || typeof Chart === "undefined") return;

  const data = {
    labels: egresos.map(e => e.mes),
    datasets: [
      {
        label: "Altas",
        data: egresos.map(e => e.altas),
        backgroundColor: "#22c55e"
      },
      {
        label: "Traslados",
        data: egresos.map(e => e.traslados),
        backgroundColor: "#f59e0b"
      },
      {
        label: "Fallecidos",
        data: egresos.map(e => e.fallecidos),
        backgroundColor: "#ef4444"
      }
    ]
  };

  if (chart) {
    chart.data = data;
    chart.update();
    return;
  }

  chart = new Chart(canvas, {
    type: "bar",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

// ===============================
// DONUT
// ===============================
function actualizarDonut(valor) {
  const canvas = document.getElementById("graficoDonut");
  if (!canvas || typeof Chart === "undefined") return;

  const text = document.getElementById("donutValor");
  if (text) text.textContent = valor + "%";

  const data = {
    labels: ["Uso", "Disponible"],
    datasets: [{
      data: [valor, 100 - valor],
      backgroundColor: ["#3b82f6", "#e5e7eb"],
      borderWidth: 0
    }]
  };

  if (donutChart) {
    donutChart.data = data;
    donutChart.update();
    return;
  }

  donutChart = new Chart(canvas, {
    type: "doughnut",
    data,
    options: {
      cutout: "70%",
      plugins: { legend: { display: false } }
    }
  });
}

// ===============================
// 🔥 RESUMEN PRO (CON BARRAS)
// ===============================
function renderResumen(indicadores, egresos) {
  const cont = document.getElementById("resumenIndicadores");
  if (!cont) return;

  cont.innerHTML = "";

  const totalEgresos = egresos.reduce((acc, e) => acc + e.altas + e.traslados + e.fallecidos, 0);
  const traslados = egresos.reduce((acc, e) => acc + e.traslados, 0);

  const data = [
    { label: "Letalidad", valor: "4.2%", porcentaje: 40, color: "red" },
    { label: "N° Egresos", valor: totalEgresos, porcentaje: totalEgresos, color: "blue" },
    { label: "Prom. Camas", valor: indicadores.dias_cama_disponibles, porcentaje: indicadores.dias_cama_disponibles, color: "green" },
    { label: "Prom. Estada", valor: indicadores.dias_estada, porcentaje: indicadores.dias_estada * 20, color: "orange" },
    { label: "Traslados", valor: traslados, porcentaje: traslados * 5, color: "blue" }
  ];

  data.forEach(item => {
    const li = document.createElement("li");
    li.className = "resumen-item";

    li.innerHTML = `
      <div class="resumen-top">
        <span>${item.label}</span>
        <strong>${item.valor}</strong>
      </div>
      <div class="resumen-bar">
        <div class="resumen-fill fill-${item.color}"></div>
      </div>
    `;

    cont.appendChild(li);

    setTimeout(() => {
      li.querySelector(".resumen-fill").style.width = item.porcentaje + "%";
    }, 100);
  });
}

// ===============================
// GLOSAS
// ===============================
function actualizarGlosas(glosas) {
  const contenedor = document.getElementById("contenedorGlosas");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!glosas.length) {
    contenedor.innerHTML = `<p class="placeholder">Sin información disponible</p>`;
    return;
  }

  glosas.forEach(({ titulo, descripcion }) => {
    const div = document.createElement("div");
    div.className = "glosa-item";

    div.innerHTML = `
      <h4>${titulo}</h4>
      <p>${descripcion}</p>
    `;

    contenedor.appendChild(div);
  });
}

// ===============================
// PDF PRO
// ===============================
function configurarPDF() {
  const btn = document.getElementById("btnExportarPDF");
  if (!btn) return;

  btn.addEventListener("click", exportarPDF);
}

async function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const contenido = document.getElementById("contenidoPDF");

  if (!contenido) return;

  const btn = document.getElementById("btnExportarPDF");

  btn.textContent = "⏳ Generando...";
  btn.disabled = true;

  contenido.classList.add("loading");

  try {
    const canvas = await html2canvas(contenido, { scale: 2 });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);

    const fecha = new Date().toISOString().slice(0, 10);
    pdf.save(`REM_${fecha}.pdf`);

  } catch (err) {
    console.error("❌ Error PDF:", err);
  }

  contenido.classList.remove("loading");
  btn.textContent = "📄 Exportar PDF";
  btn.disabled = false;
}