import { createGradient, crosshairPlugin } from "./chart-utils.js";

document.addEventListener("DOMContentLoaded", async () => {

  if (typeof Chart === "undefined") {
    console.error("Chart.js no cargó");
    return;
  }

  Chart.register(crosshairPlugin);

  const ctxLineEl = document.getElementById("egresos");
  const ctxDonutEl = document.getElementById("ocupacion");

  if (!ctxLineEl || !ctxDonutEl) return;

  const ctxLine = ctxLineEl.getContext("2d");
  const ctxDonut = ctxDonutEl.getContext("2d");

  // =========================
  // FETCH DATOS REALES (JSON)
  // =========================
  let dataGlobal = null;
  try {
    const res = await fetch("./data/rem.json");
    if (!res.ok) throw new Error("Error al cargar JSON");
    const json = await res.json();
    dataGlobal = json.niveles;
  } catch (error) {
    console.error("No se pudo sincronizar el Dashboard con los datos reales:", error);
    return;
  }

  const dataTotal = dataGlobal.find(n => n.codigo === 0);
  const dataServicios = dataGlobal.filter(n => n.codigo !== 0);

  // =========================
  // ACTUALIZAR KPIs
  // =========================
  const formatMap = {
    kpiOcupacion: (v) => v.toFixed(1) + "%",
    kpiEstada: (v) => v.toFixed(1),
    kpiRotacion: (v) => v.toFixed(1),
    kpiLetalidad: (v) => v.toFixed(1) + "%"
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

  window.updateKPIs = function (ocupacion, estada, rotacion, letalidad) {
    animateValue("kpiOcupacion", ocupacion);
    animateValue("kpiEstada", estada);
    animateValue("kpiRotacion", rotacion);
    animateValue("kpiLetalidad", letalidad);
  };

  // Cargar KPIs iniciales con Data Real
  updateKPIs(
    dataTotal.indicadores.indice_ocupacional,
    dataTotal.resumen.promedio_estada,
    dataTotal.indicadores.indice_rotacion,
    dataTotal.resumen.letalidad
  );

  // =========================
  // BAR CHART (EGRESOS) - ESTÉTICA MEJORADA
  // =========================
  const barChart = new Chart(ctxLine, {
    type: "bar",
    data: {
      labels: dataTotal.egresos.map(e => e.mes),
      datasets: [
        { label: "Altas", data: dataTotal.egresos.map(e => e.altas), backgroundColor: "#10b981", borderRadius: 4, barPercentage: 0.6 },
        { label: "Traslados", data: dataTotal.egresos.map(e => e.traslados), backgroundColor: "#3b82f6", borderRadius: 4, barPercentage: 0.6 },
        { label: "Fallecidos", data: dataTotal.egresos.map(e => e.fallecidos), backgroundColor: "#ef4444", borderRadius: 4, barPercentage: 0.6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: "easeOutQuart" },
      plugins: { legend: { display: false } },
      scales: { 
        x: { stacked: true, grid: { display: false } }, 
        y: { stacked: true, border: { dash: [4, 4] }, grid: { color: "#e2e8f0" } } 
      }
    }
  });

  // =========================
  // DONUT CHART (DISTRIBUCIÓN)
  // =========================
  let centerText = "Total Camas";
  let centerValue = dataTotal.indicadores.dias_cama_ocupados;

  const centerTextPlugin = {
    id: "centerText",
    beforeDraw(chart) {
      const { width, height, ctx } = chart;
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, height / 3.2, 0, 2 * Math.PI);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
      ctx.font = "600 24px Inter";
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      ctx.fillText(centerValue, width / 2, height / 2 - 5);
      ctx.font = "500 12px Inter";
      ctx.fillStyle = "#64748b";
      ctx.fillText(centerText, width / 2, height / 2 + 18);
      ctx.restore();
    }
  };

  const donutChart = new Chart(ctxDonut, {
    type: "doughnut",
    data: {
      labels: dataServicios.map(s => s.nombre),
      datasets: [{
        data: dataServicios.map(s => s.indicadores.dias_cama_ocupados),
        backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
        hoverOffset: 18, borderWidth: 2, borderColor: "#fff"
      }]
    },
    options: {
      cutout: "70%",
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      onHover: (event, elements) => {
        const chart = event.chart;
        if (elements.length > 0) {
          const i = elements[0].index;
          if (chart.getDataVisibility(i)) {
              centerValue = chart.data.datasets[0].data[i];
              centerText = chart.data.labels[i];
          }
        } else {
          let visibleTotal = 0;
          chart.data.datasets[0].data.forEach((val, idx) => {
              if(chart.getDataVisibility(idx)) visibleTotal += val;
          });
          centerValue = visibleTotal;
          centerText = "Total Camas";
        }
        chart.draw();
      }
    },
    plugins: [centerTextPlugin]
  });

  ctxDonutEl.addEventListener("mouseleave", () => {
    let visibleTotal = 0;
    donutChart.data.datasets[0].data.forEach((val, idx) => {
        if(donutChart.getDataVisibility(idx)) visibleTotal += val;
    });
    centerValue = visibleTotal;
    centerText = "Total Camas";
    donutChart.draw();
  });

  // =========================
  // FILTROS HTML (CHECKBOXES)
  // =========================
  document.querySelectorAll('#filtrosEgresos input').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      barChart.setDatasetVisibility(parseInt(e.target.value), e.target.checked);
      barChart.update();
    });
  });

  const checkboxesDistribucion = document.querySelectorAll('#filtrosDistribucion input');
  if (checkboxesDistribucion.length > 0) {
      // Modificamos el texto del HTML para que empate con el JSON
      checkboxesDistribucion[0].parentElement.innerHTML = `<input type="checkbox" value="0" checked> UCI Adulto`;
      checkboxesDistribucion[1].parentElement.innerHTML = `<input type="checkbox" value="1" checked> UTI Adulto`;
      checkboxesDistribucion[2].parentElement.innerHTML = `<input type="checkbox" value="2" checked> Obstetricia`;
      if(checkboxesDistribucion[3]) checkboxesDistribucion[3].parentElement.style.display = 'none';

      document.querySelectorAll('#filtrosDistribucion input').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const dataIndex = parseInt(e.target.value);
          if (donutChart.getDataVisibility(dataIndex) !== e.target.checked) {
              donutChart.toggleDataVisibility(dataIndex);
          }
          donutChart.update();
          
          let visibleTotal = 0;
          donutChart.data.datasets[0].data.forEach((val, idx) => {
              if(donutChart.getDataVisibility(idx)) visibleTotal += val;
          });
          centerValue = visibleTotal;
          centerText = "Total Camas";
          donutChart.draw();
        });
      });
  }

  // =========================
  // OCUPACIÓN POR SERVICIO (BARRAS DINÁMICAS)
  // =========================
  const contenedorBarras = document.getElementById("contenedorBarrasServicio");
  if (contenedorBarras) {
    contenedorBarras.innerHTML = "";
    dataServicios.forEach(s => {
      const ocupacion = s.indicadores.indice_ocupacional;
      let colorClass = "green";
      if (ocupacion >= 90) colorClass = "red";
      else if (ocupacion >= 75) colorClass = "orange";

      contenedorBarras.innerHTML += `
        <div class="bar-group">
          <p>${s.nombre} <strong>${ocupacion.toFixed(1)}%</strong></p>
          <div class="bar">
            <div class="fill ${colorClass}" style="width: 0%" data-width="${ocupacion}%"></div>
          </div>
        </div>
      `;
    });

    // Pequeña pausa para que se ejecute la animación
    setTimeout(() => {
      document.querySelectorAll(".bar-group .fill").forEach(bar => {
        bar.style.width = bar.dataset.width;
        bar.style.transition = "width 1.5s ease-out";
      });
    }, 100);
  }

  // =========================
  // ALERTAS DINÁMICAS
  // =========================
  const contenedorAlertas = document.getElementById("contenedorAlertas");
  if (contenedorAlertas) {
    contenedorAlertas.innerHTML = "<h3>⚠️ Alertas Generadas</h3>";
    let alertas = 0;
    
    dataServicios.forEach(s => {
      if (s.indicadores.indice_ocupacional > 90) {
        contenedorAlertas.innerHTML += `<div class="alert red">${s.nombre} en estado crítico (${s.indicadores.indice_ocupacional.toFixed(1)}%)</div>`;
        alertas++;
      }
    });

    if (dataTotal.indicadores.indice_rotacion > 10) {
        contenedorAlertas.innerHTML += `<div class="alert orange">Alta rotación general (${dataTotal.indicadores.indice_rotacion.toFixed(1)})</div>`;
        alertas++;
    }

    if (alertas === 0) {
      contenedorAlertas.innerHTML += `<div class="alert green">Sistema estable, sin alertas críticas</div>`;
    }
  }

});