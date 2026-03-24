// ===============================
// CONFIG GLOBAL
// ===============================
Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
Chart.defaults.color = "#94a3b8";


// ===============================
// CROSSHAIR
// ===============================
export const crosshairPlugin = {
  id: 'crosshair',
  afterDraw(chart) {
    if (chart.tooltip?._active?.length) {
      const ctx = chart.ctx;
      const x = chart.tooltip._active[0].element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.strokeStyle = "rgba(148,163,184,0.2)";
      ctx.stroke();
      ctx.restore();
    }
  }
};


// ===============================
// GRADIENT
// ===============================
export function createGradient(ctx, color) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, color.replace("1)", "0.3)"));
  gradient.addColorStop(1, color.replace("1)", "0)"));
  return gradient;
}
function actualizarGrafico(egresos) {
  const ctx = document.getElementById("graficoEgresos");

  const labels = egresos.map(e => e.mes);

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Altas",
        data: egresos.map(e => e.altas),
        backgroundColor: "green"
      },
      {
        label: "Traslados",
        data: egresos.map(e => e.traslados),
        backgroundColor: "orange"
      },
      {
        label: "Fallecidos",
        data: egresos.map(e => e.fallecidos),
        backgroundColor: "red"
      }
    ]
  };

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "bar",
    data: data
  });
}