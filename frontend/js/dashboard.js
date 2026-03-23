import { createGradient, crosshairPlugin } from "./chart-utils.js";

document.addEventListener("DOMContentLoaded", () => {

  if (typeof Chart === "undefined") {
    console.error("Chart.js no cargó");
    return;
  }

  Chart.register(crosshairPlugin);

  const ctxLineEl = document.getElementById("egresos");
  const ctxDonutEl = document.getElementById("ocupacion");

  if (!ctxLineEl || !ctxDonutEl) {
    console.error("Canvas no encontrados");
    return;
  }

  const ctxLine = ctxLineEl.getContext("2d");
  const ctxDonut = ctxDonutEl.getContext("2d");

  /* ========================= */
  /* KPI ANIMATION */
  /* ========================= */
  function animateValue(id, end, duration = 800) {
    const el = document.getElementById(id);
    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const value = Math.min((progress / duration) * end, end);

      if (id === "kpiOcupacion") el.innerText = Math.floor(value) + "%";
      else if (id === "kpiLetalidad") el.innerText = value.toFixed(1) + "%";
      else el.innerText = value.toFixed(1);

      if (progress < duration) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  animateValue("kpiOcupacion", 85);
  animateValue("kpiEstada", 4.2);
  animateValue("kpiRotacion", 5.4);
  animateValue("kpiLetalidad", 2.1);

  /* ========================= */
  /* BAR CHART PRO */
  /* ========================= */
  const datasetsOriginal = [
    { label: "Altas Médicas", data: [30, 40, 45, 35, 50], color: "#10b981" },
    { label: "Traslados", data: [8, 10, 12, 10, 20], color: "#f59e0b" },
    { label: "Egresos Fallecidos", data: [2, 5, 3, 5, 10], color: "#ef4444" }
  ];

  let activosBar = [true, true, true];

  const barChart = new Chart(ctxLine, {
    type: "bar",
    data: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May"],
      datasets: datasetsOriginal.map(d => ({
        label: d.label,
        data: d.data,
        backgroundColor: d.color,
        borderRadius: 6
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "bottom",

          onClick: (e, legendItem, legend) => {
            const index = legendItem.datasetIndex;

            activosBar[index] = !activosBar[index];

            barChart.data.datasets[index].data = activosBar[index]
              ? datasetsOriginal[index].data
              : datasetsOriginal[index].data.map(() => 0);

            barChart.data.datasets[index].backgroundColor =
              activosBar[index] ? datasetsOriginal[index].color : "#e5e7eb";

            barChart.update();
          }
        },

        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "#111827",
          titleColor: "#fff",
          bodyColor: "#fff",
          padding: 10,
          cornerRadius: 8
        }
      },

      scales: {
        x: { stacked: true },
        y: { stacked: true }
      }
    }
  });

  /* ========================= */
  /* DONUT PRO (FIX TOTAL) */
  /* ========================= */
  const dataOriginal = [40, 30, 15, 15];
  let activos = [true, true, true, true];
  let hoveredIndex = null;

  const colores = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
  const colorOff = "#e5e7eb";

  /* 🔥 PLUGIN FIXED */
  const centerTextPlugin = {
    id: "centerText",

    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;

      const { left, right, top, bottom } = chartArea;

      const width = right - left;
      const height = bottom - top;

      ctx.save();
      ctx.font = "bold 28px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const data = chart.data.datasets[0].data;

      let valor = 0;

      if (
        hoveredIndex !== null &&
        data[hoveredIndex] !== undefined
      ) {
        valor = data[hoveredIndex];
      } else {
        valor = data.reduce((a, b) => a + (Number(b) || 0), 0);
      }

      ctx.fillStyle = "#0f172a";
      ctx.fillText(valor + "%", left + width / 2, top + height / 2);

      ctx.restore();
    }
  };

  const donutChart = new Chart(ctxDonut, {
    type: "doughnut",
    data: {
      labels: ["Medicina", "Cirugía", "Pediatría", "Maternidad"],
      datasets: [{
        data: [...dataOriginal],
        backgroundColor: [...colores],
        hoverOffset: 30
      }]
    },

    options: {
      responsive: true,
      cutout: "70%",

      plugins: {
        legend: {
          position: "bottom",

          onClick: (e, legendItem, legend) => {
            const index = legendItem.index;

            activos[index] = !activos[index];

            donutChart.data.datasets[0].data = dataOriginal.map((v, i) =>
              activos[i] ? v : 0
            );

            donutChart.data.datasets[0].backgroundColor =
              dataOriginal.map((_, i) =>
                activos[i] ? colores[i] : colorOff
              );

            donutChart.update();
          }
        },

        tooltip: {
          backgroundColor: "#111827",
          titleColor: "#fff",
          bodyColor: "#fff",
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw}%`
          }
        }
      },

      /* 🔥 HOVER FIX */
      onHover: (event, elements, chart) => {
        const canvas = event.native.target;

        if (elements.length > 0) {
          canvas.style.cursor = "pointer";
          hoveredIndex = elements[0].index;
        } else {
          canvas.style.cursor = "default";
          hoveredIndex = null;
        }

        chart.update("none"); // 🔥 CLAVE
      }
    },

    plugins: [centerTextPlugin]
  });

});