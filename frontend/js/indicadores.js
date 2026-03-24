import { createGradient, crosshairPlugin } from "./chart-utils.js";

document.addEventListener("DOMContentLoaded", () => {

  if (typeof Chart === "undefined") {
    console.error("Chart no cargó");
    return;
  }

  Chart.register(crosshairPlugin);

  const ocupacionEl = document.getElementById("ocupacionChart");
  const esperaEl = document.getElementById("esperaChart");

  if (!ocupacionEl || !esperaEl) {
    console.error("Canvas no encontrados");
    return;
  }

  const ctxOcupacion = ocupacionEl.getContext("2d");
  const ctxEspera = esperaEl.getContext("2d");

  /* ========================= */
  /* OCUPACIÓN MENSUAL (LINE) */
  /* ========================= */

  const ocupacionChart = new Chart(ctxOcupacion, {
    type: "line",

    data: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May"],
      datasets: [{
        label: "Ocupación %",
        data: [70, 75, 80, 78, 85],

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

      interaction: {
        mode: "index",
        intersect: false
      },

      plugins: {
        legend: { display: false },

        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#fff",
          bodyColor: "#cbd5f5",
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (ctx) => ctx.raw + "%"
          }
        }
      },

      animation: {
        duration: 1400,
        easing: "easeOutQuart"
      },

      animations: {
        x: {
          type: "number",
          easing: "easeOutQuart",
          duration: 1200,
          from: 0
        },
        y: {
          type: "number",
          easing: "easeOutQuart",
          duration: 1200,
          from: 0
        },
        tension: {
          duration: 1000,
          easing: "easeOutQuart",
          from: 0.1,
          to: 0.4
        }
      },

      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          grid: {
            color: "rgba(0,0,0,0.05)"
          },
          ticks: {
            callback: (value) => value + "%"
          }
        }
      }
    }
  });


  /* ========================= */
  /* TIEMPO DE ESPERA (BAR) */
  /* ========================= */

  const esperaChart = new Chart(ctxEspera, {
    type: "bar",

    data: {
      labels: ["Urgencia", "Consulta", "Cirugía"],
      datasets: [{
        label: "Minutos",
        data: [45, 30, 60],

        backgroundColor: [
          "#ef4444",
          "#f59e0b",
          "#10b981"
        ],

        borderRadius: 10,
        hoverBackgroundColor: [
          "#dc2626",
          "#d97706",
          "#059669"
        ]
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: { display: false },

        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#fff",
          bodyColor: "#cbd5f5",
          padding: 10,
          callbacks: {
            label: (ctx) => ctx.raw + " min"
          }
        }
      },

      animation: {
        duration: 1400,
        easing: "easeOutBack"
      },

      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          grid: {
            color: "rgba(0,0,0,0.05)"
          }
        }
      }
    }
  });


  /* ========================= */
  /* SECUENCIA DE ENTRADA PRO */
  /* ========================= */

  setTimeout(() => {
    ocupacionChart.update();
  }, 200);

  setTimeout(() => {
    esperaChart.update();
  }, 400);

});