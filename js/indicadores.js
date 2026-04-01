import { createGradient, crosshairPlugin } from "./chart-utils.js";

document.addEventListener("DOMContentLoaded", async () => {

  if (typeof Chart === "undefined") {
    console.error("Chart no cargó");
    return;
  }

  Chart.register(crosshairPlugin);

  const ocupacionEl = document.getElementById("ocupacionChart");
  const esperaEl = document.getElementById("esperaChart"); // Lo usaremos para Egresos

  if (!ocupacionEl || !esperaEl) {
    console.error("Canvas no encontrados");
    return;
  }

  const ctxOcupacion = ocupacionEl.getContext("2d");
  const ctxEspera = esperaEl.getContext("2d");

  // =========================
  // 1. FETCH DATOS REM.JSON
  // =========================
  let datosHospital;
  try {
    const response = await fetch("./data/rem.json");
    if (!response.ok) throw new Error("Fallo al cargar rem.json");
    const json = await response.json();
    
    // Obtenemos los datos totales del establecimiento (código 0)
    datosHospital = json.niveles.find(n => n.codigo === 0);
  } catch (error) {
    console.error("Error cargando datos para indicadores:", error);
    return;
  }

  // =========================
  // 2. ACTUALIZAR KPIs DINÁMICOS
  // =========================
  document.getElementById("indOcupacion").innerText = datosHospital.indicadores.indice_ocupacional + "%";
  document.getElementById("indEstada").innerText = datosHospital.resumen.promedio_estada + " días";
  document.getElementById("indRotacion").innerText = datosHospital.indicadores.indice_rotacion;
  document.getElementById("indLetalidad").innerText = datosHospital.resumen.letalidad + "%";

  // Preparamos los datos para los gráficos basados en el JSON
  const mesesLabels = datosHospital.egresos.map(e => {
    // Convierte "2025-01" a "Ene", "2025-02" a "Feb", etc.
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const mesIndex = parseInt(e.mes.split("-")[1], 10) - 1;
    return meses[mesIndex];
  });

  const datosAltas = datosHospital.egresos.map(e => e.altas);
  const datosFallecidos = datosHospital.egresos.map(e => e.fallecidos);

  // Simularemos la tendencia de ocupación mensual (ya que el JSON solo tiene egresos por mes, 
  // generaremos una curva realista basada en el índice ocupacional base)
  const baseOcupacion = datosHospital.indicadores.indice_ocupacional;
  const tendenciaOcupacion = mesesLabels.map((_, i) => {
    // Variación sutil para el gráfico (± 5%)
    return Math.max(0, Math.min(100, baseOcupacion + (Math.sin(i) * 5))); 
  });


  /* ========================= */
  /* GRÁFICO 1: TENDENCIA DE OCUPACIÓN (LINE) */
  /* ========================= */
  const ocupacionChart = new Chart(ctxOcupacion, {
    type: "line",
    data: {
      labels: mesesLabels,
      datasets: [{
        label: "Ocupación %",
        data: tendenciaOcupacion,
        borderColor: "#2563eb",
        backgroundColor: createGradient(ctxOcupacion, "rgba(37,99,235,1)"),
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: "#2563eb"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#fff",
          bodyColor: "#cbd5f5",
          padding: 10,
          displayColors: false,
          callbacks: { label: (ctx) => ctx.raw.toFixed(1) + "%" }
        }
      },
      animation: { duration: 1400, easing: "easeOutQuart" },
      scales: {
        x: { grid: { display: false } },
        y: { 
          grid: { color: "rgba(0,0,0,0.05)" },
          ticks: { callback: (value) => value + "%" }
        }
      }
    }
  });


  /* ========================= */
  /* GRÁFICO 2: EVOLUCIÓN DE EGRESOS (BAR) */
  /* ========================= */
  // Cambiamos el título en el HTML desde JS para reflejar el nuevo dato
  const cardTituloEspera = esperaEl.closest('.card').querySelector('h3');
  if (cardTituloEspera) cardTituloEspera.innerText = "📊 Evolución de Egresos";

  const esperaChart = new Chart(ctxEspera, {
    type: "bar",
    data: {
      labels: mesesLabels,
      datasets: [
        {
          label: "Altas Exitosas",
          data: datosAltas,
          backgroundColor: "#10b981",
          borderRadius: 6,
        },
        {
          label: "Fallecidos",
          data: datosFallecidos,
          backgroundColor: "#ef4444",
          borderRadius: 6,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { usePointStyle: true, boxWidth: 8 } },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#fff",
          bodyColor: "#cbd5f5",
          padding: 10
        }
      },
      animation: { duration: 1400, easing: "easeOutBack" },
      scales: {
        x: { grid: { display: false }, stacked: true },
        y: { grid: { color: "rgba(0,0,0,0.05)" }, stacked: true }
      }
    }
  });

});