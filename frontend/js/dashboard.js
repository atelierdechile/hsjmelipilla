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
  /* KPI ANIMATION MEJORADO  */
  /* ========================= */
  function animateValue(id, end, duration = 800) {
    const el = document.getElementById(id);
    const start = 0;
    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      // Calculamos el valor actual sin redondear todavía para soportar decimales
      const value = Math.min((progress / duration) * end, end);

      // Formateamos dependiendo del tipo de KPI
      if (id === "kpiOcupacion") {
        el.innerText = Math.floor(value) + "%";
      } else if (id === "kpiLetalidad") {
        el.innerText = value.toFixed(1) + "%";
      } else if (id === "kpiEstada" || id === "kpiRotacion") {
        el.innerText = value.toFixed(1);
      } else {
        el.innerText = Math.floor(value);
      }

      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  animateValue("kpiOcupacion", 85);
  animateValue("kpiEstada", 4.2); 
  animateValue("kpiRotacion", 5.4);
  animateValue("kpiLetalidad", 2.1);


  /* ========================= */
  /* GRÁFICO DE BARRAS APILADAS */
  /* ========================= */
  new Chart(ctxLine, {
    type: "bar",
    data: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May"],
      datasets: [
        {
          label: "Altas Médicas",
          data: [30, 40, 45, 35, 50],
          backgroundColor: "#10b981",
          borderRadius: 4
        },
        {
          label: "Traslados",
          data: [8, 10, 12, 10, 20],
          backgroundColor: "#f59e0b",
          borderRadius: 4
        },
        {
          label: "Egresos Fallecidos",
          data: [2, 5, 3, 5, 10],
          backgroundColor: "#ef4444",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: "bottom",
          labels: { font: { family: "'Inter', sans-serif" } }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      },
      animation: {
        duration: 1000
      }
    }
  });


  /* ========================= */
  /* DONUT CENTER TEXT PLUGIN */
  /* ========================= */
  const centerTextPlugin = {
    id: "centerText",
    beforeDraw(chart) {
      const { width } = chart;
      const { height } = chart;
      const ctx = chart.ctx;

      ctx.restore();
      const fontSize = (height / 100).toFixed(2);
      ctx.font = `${fontSize}em Inter`;
      ctx.textBaseline = "middle";

      const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
      const text = total + "%";

      const textX = Math.round((width - ctx.measureText(text).width) / 2);
      const textY = height / 2;

      ctx.fillStyle = "#0f172a";
      ctx.fillText(text, textX, textY);
      ctx.save();
    }
  };

  /* ========================= */
  /* DONUT CHART */
  /* ========================= */
  new Chart(ctxDonut, {
    type: "doughnut",
    data: {
      labels: ["Medicina", "Cirugía", "Pediatría", "Maternidad"],
      datasets: [{
        data: [40, 30, 15, 15],
        backgroundColor: [
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#ef4444"
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,

      cutout: "70%",

      plugins: {
        legend: {
          position: "bottom"
        }
      },

      animation: {
        animateRotate: true,
        duration: 1200
      }
    },
    plugins: [centerTextPlugin]
  });

});