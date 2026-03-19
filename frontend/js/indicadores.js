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
  new Chart(ctxOcupacion, {
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
        pointHoverRadius: 6
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: { display: false }
      },

      scales: {
        y: {
          ticks: {
            callback: (value) => value + "%"
          }
        }
      },

      animation: {
        duration: 900
      }
    }
  });


  /* ========================= */
  /* TIEMPO DE ESPERA (BAR) */
  /* ========================= */
  new Chart(ctxEspera, {
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

        borderRadius: 8
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: { display: false }
      },

      animation: {
        duration: 900
      }
    }
  });

});