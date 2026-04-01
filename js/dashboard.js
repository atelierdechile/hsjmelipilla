document.addEventListener("DOMContentLoaded", async () => {

  if (typeof Chart === "undefined") {
    console.error("Chart.js no cargó");
    return;
  }

  const ctxLineEl = document.getElementById("egresos");
  const ctxDonutEl = document.getElementById("ocupacion");

  if (!ctxLineEl || !ctxDonutEl) return;

  const ctxLine = ctxLineEl.getContext("2d");
  const ctxDonut = ctxDonutEl.getContext("2d");

  // =========================
  // FETCH JSON
  // =========================
  let dataGlobal = null;
  try {
    const res = await fetch("./data/rem.json");
    const json = await res.json();
    dataGlobal = json.niveles;
  } catch (error) {
    console.error("Error cargando JSON:", error);
    return;
  }

  // 🔥 FIX STRING
  const dataTotal = dataGlobal.find(n => n.codigo === "0");
  const dataServicios = dataGlobal.filter(n => n.codigo !== "0");

  // =========================
  // KPIs
  // =========================
  const formatMap = {
    kpiOcupacion: v => v.toFixed(1) + "%",
    kpiEstada: v => v.toFixed(1),
    kpiRotacion: v => v.toFixed(1),
    kpiLetalidad: v => v.toFixed(1) + "%"
  };

  function animateValue(id, end, duration = 800) {
    const el = document.getElementById(id);
    if (!el) return;

    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const value = Math.min((progress / duration) * end, end);
      el.innerText = formatMap[id](value);
      if (progress < duration) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  animateValue("kpiOcupacion", dataTotal.indicadores.indice_ocupacional);
  animateValue("kpiEstada", dataTotal.resumen.promedio_estada);
  animateValue("kpiRotacion", dataTotal.indicadores.indice_rotacion);
  animateValue("kpiLetalidad", dataTotal.resumen.letalidad);

  // =========================
  // EGRESOS
  // =========================
  const barChart = new Chart(ctxLine, {
    type: "bar",
    data: {
      labels: dataTotal.egresos.map(e => e.mes),
      datasets: [
        {
          label: "Altas",
          data: dataTotal.egresos.map(e => e.altas || 0),
          backgroundColor: "#10b981"
        },
        {
          label: "Traslados",
          data: dataTotal.egresos.map(e => e.traslados || 0),
          backgroundColor: "#3b82f6"
        },
        {
          label: "Fallecidos",
          data: dataTotal.egresos.map(e => e.fallecidos || 0),
          backgroundColor: "#ef4444"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      }
    }
  });

  // =========================
  // FILTRAR SERVICIOS
  // =========================
  const serviciosFiltrados = dataServicios.filter(s =>
    s.nombre.includes("UCI") ||
    s.nombre.includes("UTI") ||
    s.nombre.includes("Obstetricia")
  );

  // =========================
  // DONUT
  // =========================
  const donutChart = new Chart(ctxDonut, {
    type: "doughnut",
    data: {
      labels: serviciosFiltrados.map(s => s.nombre),
      datasets: [{
        data: serviciosFiltrados.map(s => s.indicadores.dias_cama_ocupados),
        backgroundColor: ["#ef4444", "#f59e0b", "#10b981"]
      }]
    },
    options: {
      cutout: "70%",
      plugins: { legend: { display: false } }
    }
  });

  // =========================
  // FILTROS
  // =========================
  document.querySelectorAll('#filtrosEgresos input').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      barChart.setDatasetVisibility(parseInt(e.target.value), e.target.checked);
      barChart.update();
    });
  });

  document.querySelectorAll('#filtrosDistribucion input').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const index = parseInt(e.target.value);
      donutChart.toggleDataVisibility(index);
      donutChart.update();
    });
  });

  // =========================
  // BARRAS
  // =========================
  const contenedor = document.getElementById("contenedorBarrasServicio");
  contenedor.innerHTML = "";

  dataServicios.forEach(s => {
    const val = s.indicadores.indice_ocupacional;

    let color = "green";
    if (val >= 90) color = "red";
    else if (val >= 75) color = "orange";

    contenedor.innerHTML += `
      <div class="bar-group">
        <p>${s.nombre} <strong>${val.toFixed(1)}%</strong></p>
        <div class="bar">
          <div class="fill ${color}" style="width:${val}%"></div>
        </div>
      </div>
    `;
  });

  // =========================
  // ALERTAS
  // =========================
  const contenedorAlertas = document.getElementById("contenedorAlertas");
  contenedorAlertas.innerHTML = "<h3>⚠️ Alertas Generadas</h3>";

  let hayAlertas = false;

  dataServicios.forEach(s => {
    if (s.indicadores.indice_ocupacional > 90) {
      contenedorAlertas.innerHTML += `
        <div class="alert red">
          ${s.nombre} crítico (${s.indicadores.indice_ocupacional.toFixed(1)}%)
        </div>`;
      hayAlertas = true;
    }
  });

  if (!hayAlertas) {
    contenedorAlertas.innerHTML += `
      <div class="alert green">Sistema estable</div>`;
  }

});