let dataGlobal = null;
let chart = null;

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await cargarData();
}

// ===============================
// FETCH JSON
// ===============================
async function cargarData() {
  try {
    // ✅ RUTA CORRECTA SEGÚN TU PROYECTO
    const res = await fetch("./data/rem.json");

    if (!res.ok) throw new Error("No se pudo cargar rem.json");

    const data = await res.json();

    if (!data.niveles || data.niveles.length === 0) {
      throw new Error("JSON inválido");
    }

    dataGlobal = data;

    llenarSelector(data.niveles);

    // cargar primer nivel automáticamente
    actualizarDashboard(data.niveles[0]);

    console.log("✅ Datos cargados correctamente", data);

  } catch (error) {
    console.error("❌ Error cargando datos:", error);
  }
}

// ===============================
// SELECT DINÁMICO
// ===============================
function llenarSelector(niveles) {
  const selector = document.getElementById("selectorNivel");

  if (!selector) return;

  selector.innerHTML = "";

  const fragment = document.createDocumentFragment();

  niveles.forEach(nivel => {
    const option = document.createElement("option");
    option.value = nivel.codigo;
    option.textContent = nivel.nombre;
    fragment.appendChild(option);
  });

  selector.appendChild(fragment);

  selector.addEventListener("change", manejarCambioNivel);
}

// ===============================
// EVENTO CAMBIO
// ===============================
function manejarCambioNivel(e) {
  const codigo = parseInt(e.target.value);

  const nivel = dataGlobal.niveles.find(n => n.codigo === codigo);

  if (!nivel) {
    console.warn("Nivel no encontrado:", codigo);
    return;
  }

  actualizarDashboard(nivel);
}

// ===============================
// ACTUALIZAR DASHBOARD
// ===============================
function actualizarDashboard(nivel) {

  if (!nivel || !nivel.indicadores) return;

  // KPIs
  setText("camasDisponibles", nivel.indicadores.dias_cama_disponibles, "%");
  setText("camaOcupadas", nivel.indicadores.dias_cama_ocupados);
  setText("diasEstada", nivel.indicadores.dias_estada);
  setText("indiceOcupacional", nivel.indicadores.indice_ocupacional, "%");

  // 🔥 PREPARADO PARA GRÁFICO
  if (nivel.egresos) {
    actualizarGrafico(nivel.egresos);
  }
}

// ===============================
// HELPER
// ===============================
function setText(id, valor, sufijo = "") {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = valor !== undefined ? valor + sufijo : "--";
}

// ===============================
// GRÁFICO (SAFE MODE)
// ===============================
function actualizarGrafico(egresos) {
  const canvas = document.getElementById("graficoEgresos");

  if (!canvas || typeof Chart === "undefined") return;

  const labels = egresos.map(e => e.mes);

  const data = {
    labels,
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
        legend: {
          position: "bottom"
        }
      }
    }
  });
}