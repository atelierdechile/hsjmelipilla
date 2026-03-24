let dataGlobal = null;
let charts = {};
let animaciones = {};
let intervalDonut = null;
let rafPointer = null;

let estado = {
  nivel: null,
  anio: "",
  mes: ""
};

const SELECTORES_ANIMABLES = {
  kpis: [".kpi", ".card"],
  glosas: "#contenedorGlosas .glosa-item",
  resumen: "#resumenIndicadores .resumen-item",
  chartCards: [
    "#graficoEgresos",
    "#graficoDonut",
    "#graficoLetalidad",
    "#graficoEstada",
    "#graficoCamas"
  ]
};

// ================= INIT =================
document.addEventListener("DOMContentLoaded", init);

async function init() {
  mostrarLoader();
  prepararSuperficies();
  configurarInteractividadUI();

  try {
    await cargarData();
    configurarFiltros();
    configurarPDF();
    requestAnimationFrame(animarEntradaUI);
  } catch (error) {
    console.error("ERROR GENERAL:", error);
    mostrarErrorPantalla(error);
  } finally {
    ocultarLoader();
  }

  setTimeout(ocultarLoader, 4000);
}

// ================= ANIMACIÓN =================
function animarEntradaUI() {
  document.querySelectorAll(".card, .kpi").forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.classList.remove("is-visible");

    setTimeout(() => {
      el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      el.classList.add("is-visible");
    }, i * 80);
  });
}

function animarActualizacionUI() {
  animarBloquesPrincipales();
  revelarItems("#contenedorGlosas .glosa-item", 85);
  revelarItems("#resumenIndicadores .resumen-item", 70);
}

function animarBloquesPrincipales() {
  const elementos = [];

  document.querySelectorAll(".kpi").forEach((el) => elementos.push(el));

  SELECTORES_ANIMABLES.chartCards.forEach((selector) => {
    const card = document.querySelector(selector)?.closest(".card");
    if (card) elementos.push(card);
  });

  const glosasCard = document.getElementById("contenedorGlosas")?.closest(".card, .glosas");
  const resumenCard = document.getElementById("resumenIndicadores")?.closest(".card");

  if (glosasCard) elementos.push(glosasCard);
  if (resumenCard) elementos.push(resumenCard);

  elementos.forEach((el, i) => dispararReveal(el, i * 55));
}

function revelarItems(selector, paso = 80) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.style.setProperty("--stagger-index", i);
    dispararReveal(el, i * paso);
  });
}

function dispararReveal(el, delay = 0) {
  if (!el) return;

  el.classList.remove("is-visible");
  el.style.opacity = "0";
  el.style.transform = "translateY(16px)";
  clearTimeout(el._revealTimeout);

  el._revealTimeout = setTimeout(() => {
    el.style.transition = "opacity 0.45s ease, transform 0.45s ease";
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
    el.classList.add("is-visible");
  }, delay);
}

// ================= LOADER =================
function mostrarLoader() {
  document.getElementById("loader")?.classList.remove("hidden");
}

function ocultarLoader() {
  document.getElementById("loader")?.classList.add("hidden");
}

// ================= DATA =================
async function cargarData() {
  const res = await fetch("./data/rem.json");
  if (!res.ok) throw new Error("No se pudo cargar rem.json");

  dataGlobal = await res.json();

  llenarSelector(dataGlobal.niveles);
  llenarAnios(dataGlobal.niveles);

  estado.nivel = dataGlobal.niveles[0];

  actualizarDashboard();
}

// ================= FILTROS =================
function configurarFiltros() {
  document.getElementById("selectorMes")?.addEventListener("change", (e) => {
    estado.mes = e.target.value;
    actualizarDashboard();
  });

  document.getElementById("selectorAnio")?.addEventListener("change", (e) => {
    estado.anio = e.target.value;
    actualizarDashboard();
  });
}

// ================= SELECT =================
function llenarSelector(niveles) {
  const selector = document.getElementById("selectorNivel");
  if (!selector) return;

  selector.innerHTML = niveles
    .map((n) => `<option value="${n.codigo}">${n.nombre}</option>`)
    .join("");

  selector.addEventListener("change", (e) => {
    estado.nivel = niveles.find((n) => n.codigo == e.target.value);
    actualizarDashboard();
  });
}

// ================= AÑOS =================
function llenarAnios(niveles) {
  const selector = document.getElementById("selectorAnio");
  if (!selector) return;

  const anios = new Set();

  niveles.forEach((n) =>
    n.egresos.forEach((e) => anios.add(e.mes.split("-")[0]))
  );

  selector.innerHTML =
    `<option value="">Todos</option>` +
    [...anios]
      .sort()
      .map((a) => `<option value="${a}">${a}</option>`)
      .join("");
}

// ================= FILTRO =================
function filtrarEgresos(egresos) {
  return egresos.filter((e) => {
    const [anio, mes] = e.mes.split("-");
    if (estado.anio && anio !== estado.anio) return false;
    if (estado.mes && mes !== estado.mes) return false;
    return true;
  });
}

// ================= DASHBOARD =================
function actualizarDashboard() {
  const nivel = estado.nivel;
  if (!nivel || !dataGlobal) return;

  const egresos = filtrarEgresos(nivel.egresos);
  const i = nivel.indicadores;

  animarNumero("camasDisponibles", i.dias_cama_disponibles);
  animarNumero("camaOcupadas", i.dias_cama_ocupados);
  animarNumero("diasEstada", i.dias_estada);
  animarNumero("indiceOcupacional", i.indice_ocupacional, "%");

  actualizarNivelCuidado(nivel.nivel_cuidado);
  actualizarGraficos(nivel, egresos);
  actualizarGlosas(dataGlobal.glosas_base, nivel, egresos);
  renderResumen(nivel.resumen, egresos);
  prepararSuperficies();
  configurarInteractividadUI();
  requestAnimationFrame(animarActualizacionUI);
}

// ================= KPI =================
function animarNumero(id, valor, sufijo = "") {
  if (animaciones[id]) clearInterval(animaciones[id]);

  const el = document.getElementById(id);
  if (!el) return;

  const numero = Number(valor) || 0;
  let actual = 0;
  const step = numero / 40;

  el.classList.remove("is-visible");
  el.style.transform = "translateY(8px) scale(0.98)";
  el.style.opacity = "0.75";

  animaciones[id] = setInterval(() => {
    actual += step || numero;
    if (actual >= numero) {
      actual = numero;
      clearInterval(animaciones[id]);
      el.classList.add("is-visible");
      el.style.transform = "";
      el.style.opacity = "";
    }
    el.textContent = formatearValor(actual, sufijo);
  }, 16);
}

// sdfdf================= NIVEL =================
function actualizarNivelCuidado(nivel) {
  const el = document.getElementById("nivelCuidado");
  if (!el || !nivel) return;

  el.textContent = nivel.tipo || "Sin nivel";
  el.className = "nivel-cuidado " + (nivel.color || "primary");
  dispararReveal(el.closest(".kpi, .card") || el, 80);
}

// ================= CHART =================
function crearGrafico(id, tipo, labels, datasets, extra = {}) {
  const ctx = document.getElementById("grafico" + capitalizar(id));
  if (!ctx) return;

  if (charts[id]) charts[id].destroy();

  const esDonut = tipo === "doughnut";
  const esLinea = tipo === "line";
  const esBarra = tipo === "bar";

  charts[id] = new Chart(ctx, {
    type: tipo,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: esDonut ? "nearest" : "index",
        intersect: false
      },
      layout: {
        padding: esDonut ? 0 : 8
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 16,
            boxWidth: 10
          }
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          titleColor: "#ffffff",
          bodyColor: "#e5e7eb",
          padding: 12,
          cornerRadius: 12,
          displayColors: true
        }
      },
      animation: {
        duration: 1000,
        easing: "easeOutQuart",
        delay(context) {
          if (context.type !== "data" || context.mode !== "default") return 0;
          return context.dataIndex * (esBarra ? 80 : 45);
        }
      },
      elements: {
        line: {
          tension: 0.35,
          borderWidth: esLinea ? 3 : 2
        },
        point: {
          radius: esLinea ? 4 : 0,
          hoverRadius: esLinea ? 6 : 0,
          borderWidth: esLinea ? 2 : 0,
          backgroundColor: esLinea ? "#ffffff" : undefined
        },
        arc: {
          borderWidth: 0,
          hoverOffset: esDonut ? 10 : 0
        },
        bar: {
          borderRadius: esBarra ? 10 : 0,
          borderSkipped: false
        }
      },
      scales: esDonut
        ? {}
        : {
            x: {
              grid: { display: false },
              ticks: {
                color: "#64748b"
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(148, 163, 184, 0.22)"
              },
              ticks: {
                color: "#64748b"
              }
            }
          },
      ...extra
    }
  });

  const card = ctx.closest(".card");
  if (card) {
    card.classList.add("chart-card");
    dispararReveal(card, 60);
  }
}

function capitalizar(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ================= GRAFICOS =================
function actualizarGraficos(nivel, egresos) {
  const labels = egresos.map((e) => formatearMes(e.mes));

  crearGrafico("egresos", "bar", labels, [
    {
      label: "Altas",
      data: egresos.map((e) => e.altas),
      backgroundColor: "#22c55e"
    },
    {
      label: "Traslados",
      data: egresos.map((e) => e.traslados),
      backgroundColor: "#3b82f6"
    },
    {
      label: "Fallecidos",
      data: egresos.map((e) => e.fallecidos),
      backgroundColor: "#ef4444"
    }
  ]);

  actualizarDonut(nivel);
  actualizarGraficoLetalidad(egresos);
  actualizarGraficoEstada(nivel, egresos);

  crearGrafico("camas", "bar", ["Disponibles", "Ocupados"], [
    {
      label: "Camas",
      data: [
        nivel.indicadores.dias_cama_disponibles,
        nivel.indicadores.dias_cama_ocupados
      ],
      backgroundColor: ["#10b981", "#3b82f6"]
    }
  ]);
}

function actualizarGraficoLetalidad(egresos) {
  const labels = egresos.map((e) => formatearMes(e.mes));
  const data = egresos.map((e) => {
    const total = (e.altas || 0) + (e.traslados || 0) + (e.fallecidos || 0);
    return total ? Number(((e.fallecidos / total) * 100).toFixed(1)) : 0;
  });

  crearGrafico("letalidad", "line", labels, [
    {
      label: "Letalidad %",
      data,
      borderColor: "#ef4444",
      backgroundColor: "rgba(239, 68, 68, 0.15)",
      tension: 0.35,
      fill: true
    }
  ]);
}

function actualizarGraficoEstada(nivel, egresos) {
  const labels = egresos.map((e) => formatearMes(e.mes));
  const promedio = Number(nivel?.resumen?.promedio_estada) || 0;
  const data = egresos.map(() => promedio);

  crearGrafico("estada", "line", labels, [
    {
      label: "Promedio días de estada",
      data,
      borderColor: "#8b5cf6",
      backgroundColor: "rgba(139, 92, 246, 0.15)",
      tension: 0.35,
      fill: true
    }
  ]);
}

// ================= DONUT =================
function actualizarDonut(nivel) {
  if (intervalDonut) clearInterval(intervalDonut);

  const ocupados = Number(nivel.indicadores.dias_cama_ocupados) || 0;
  const total = Number(nivel.indicadores.dias_cama_disponibles) || 0;
  const libres = Math.max(total - ocupados, 0);
  const porcentaje = total > 0 ? (ocupados / total) * 100 : 0;

  animarDonutTexto("donutValor", porcentaje);

  crearGrafico(
    "donut",
    "doughnut",
    ["Ocupados", "Libres"],
    [
      {
        data: [ocupados, libres],
        backgroundColor: ["#ef4444", "#e5e7eb"],
        borderWidth: 0
      }
    ],
    {
      cutout: "70%",
      plugins: {
        legend: {
          display: false
        }
      }
    }
  );
}

// ================= DONUT TEXTO =================
function animarDonutTexto(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;

  let actual = 0;
  const numero = Number(valor) || 0;
  const step = numero / 30;

  el.classList.remove("is-visible");
  el.style.transform = "scale(0.9)";
  el.style.opacity = "0.5";

  intervalDonut = setInterval(() => {
    actual += step || numero;
    if (actual >= numero) {
      actual = numero;
      clearInterval(intervalDonut);
      el.classList.add("is-visible");
      el.style.transform = "";
      el.style.opacity = "";
    }
    el.textContent = actual.toFixed(1) + "%";
  }, 16);
}

// ================= GLOSAS =================
function obtenerValorGlosa(nivel, titulo, egresosFiltrados = nivel.egresos) {
  const totalFallecidos = (egresosFiltrados || []).reduce(
    (acc, item) => acc + (item.fallecidos || 0),
    0
  );

  const totalEgresos = (egresosFiltrados || []).reduce(
    (acc, item) => acc + (item.altas || 0) + (item.traslados || 0) + (item.fallecidos || 0),
    0
  );

  const totalTraslados = (egresosFiltrados || []).reduce(
    (acc, item) => acc + (item.traslados || 0),
    0
  );

  const letalidadCalculada = totalEgresos
    ? Number(((totalFallecidos / totalEgresos) * 100).toFixed(1))
    : Number(nivel?.resumen?.letalidad || 0);

  const map = {
    "Días Cama Disponibles": nivel.indicadores.dias_cama_disponibles,
    "Días Cama Ocupados": nivel.indicadores.dias_cama_ocupados,
    "Días de Estada": nivel.indicadores.dias_estada,
    "Índice Ocupacional": nivel.indicadores.indice_ocupacional + "%",
    "Índice de Rotación": nivel.indicadores.indice_rotacion,
    Letalidad: letalidadCalculada + "%",
    "Número de Egresos": totalEgresos || nivel.resumen.egresos_total,
    "Promedio Cama Disponibles": nivel.resumen.promedio_camas,
    "Promedio Días de Estada": nivel.resumen.promedio_estada,
    Traslados: totalTraslados || nivel.resumen.traslados,
    "Egresos Fallecidos": totalFallecidos
  };

  return map[titulo] ?? "-";
}

function actualizarGlosas(glosasBase, nivel, egresosFiltrados) {
  const contenedor = document.getElementById("contenedorGlosas");
  if (!contenedor) return;

  if (!Array.isArray(glosasBase) || glosasBase.length === 0) {
    contenedor.innerHTML = `<p class="empty-state glosa-item">No hay glosas disponibles.</p>`;
    revelarItems("#contenedorGlosas .glosa-item", 60);
    return;
  }

  contenedor.innerHTML = glosasBase
    .map((glosa, index) => {
      const valor = obtenerValorGlosa(nivel, glosa.titulo, egresosFiltrados);

      return `
        <article class="glosa-item" style="--stagger-index:${index}">
          <div class="glosa-item__header">
            <h4>${glosa.titulo}</h4>
            <span class="glosa-item__valor">${formatearValor(valor)}</span>
          </div>
          <p>${glosa.descripcion}</p>
        </article>
      `;
    })
    .join("");

  revelarItems("#contenedorGlosas .glosa-item", 90);
}

// ================= RESUMEN =================
function renderResumen(resumen, egresosFiltrados) {
  const contenedor = document.getElementById("resumenIndicadores");
  if (!contenedor || !resumen) return;

  const totalFallecidos = (egresosFiltrados || []).reduce(
    (acc, item) => acc + (item.fallecidos || 0),
    0
  );

  const totalEgresos = (egresosFiltrados || []).reduce(
    (acc, item) => acc + (item.altas || 0) + (item.traslados || 0) + (item.fallecidos || 0),
    0
  );

  const resumenItems = [
    ["Letalidad", `${resumen.letalidad}%`],
    ["Egresos totales", totalEgresos || resumen.egresos_total],
    ["Promedio camas", resumen.promedio_camas],
    ["Promedio estada", resumen.promedio_estada],
    ["Traslados", resumen.traslados],
    ["Fallecidos", totalFallecidos]
  ];

  contenedor.innerHTML = resumenItems
    .map(
      ([label, value], index) => `
        <div class="resumen-item" style="--stagger-index:${index}">
          <span>${label}</span>
          <strong>${formatearValor(value)}</strong>
        </div>
      `
    )
    .join("");

  revelarItems("#resumenIndicadores .resumen-item", 75);
}

// ================= UI INTERACTIVA =================
function prepararSuperficies() {
  document.querySelectorAll(".kpi").forEach((el) => {
    el.classList.add("interactive-surface");
  });

  SELECTORES_ANIMABLES.chartCards.forEach((selector) => {
    const card = document.querySelector(selector)?.closest(".card");
    if (card) {
      card.classList.add("interactive-surface", "chart-card");
    }
  });

  const glosas = document.getElementById("contenedorGlosas")?.closest(".card, .glosas");
  const resumen = document.getElementById("resumenIndicadores")?.closest(".card");

  if (glosas) glosas.classList.add("interactive-surface");
  if (resumen) resumen.classList.add("interactive-surface");
}

function configurarInteractividadUI() {
  document.querySelectorAll(".interactive-surface").forEach((el) => {
    if (el.dataset.interactiveReady === "true") return;

    el.dataset.interactiveReady = "true";

    el.addEventListener("mouseenter", () => {
      el.classList.add("is-hovered");
    });

    el.addEventListener("mouseleave", () => {
      el.classList.remove("is-hovered");
      el.style.removeProperty("transform");
      el.style.removeProperty("--pointer-x");
      el.style.removeProperty("--pointer-y");
    });

    el.addEventListener("mousemove", (event) => {
      if (rafPointer) cancelAnimationFrame(rafPointer);

      rafPointer = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateX = ((y / rect.height) - 0.5) * -5;
        const rotateY = ((x / rect.width) - 0.5) * 5;

        el.style.setProperty("--pointer-x", `${x}px`);
        el.style.setProperty("--pointer-y", `${y}px`);
        el.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
      });
    });
  });
}

// ================= PDF =================
function configurarPDF() {
  const btn = document.getElementById("btnExportarPDF");
  if (!btn) return;

  btn.addEventListener("click", exportarPDF);
}

async function exportarPDF() {
  const contenido = document.getElementById("contenidoPDF");
  if (!contenido || !window.html2canvas || !window.jspdf) return;

  mostrarLoader();

  try {
    const canvas = await html2canvas(contenido, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 10;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 5;

    pdf.addImage(imgData, "PNG", 5, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 10;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 5;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 5, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 10;
    }

    pdf.save("rem-hospital-san-jose.pdf");
  } catch (error) {
    console.error("Error al exportar PDF:", error);
  } finally {
    ocultarLoader();
  }
}

// ================= ERROR UI =================
function mostrarErrorPantalla(error) {
  const contenedor = document.getElementById("contenedorGlosas");
  if (!contenedor) return;

  contenedor.innerHTML = `
    <article class="glosa-item is-visible">
      <div class="glosa-item__header">
        <h4>Error al cargar REM</h4>
        <span class="glosa-item__valor">!</span>
      </div>
      <p>${error?.message || "Ocurrió un problema inesperado al cargar la información."}</p>
    </article>
  `;
}

// ================= HELPERS =================
function formatearMes(valor) {
  if (!valor || typeof valor !== "string" || !valor.includes("-")) return valor;

  const [anio, mes] = valor.split("-");
  const fecha = new Date(Number(anio), Number(mes) - 1, 1);

  return fecha.toLocaleDateString("es-CL", {
    month: "short",
    year: "numeric"
  });
}

function formatearValor(valor, sufijo = "") {
  if (typeof valor === "string") return valor;

  const numero = Number(valor);
  if (Number.isNaN(numero)) return String(valor ?? "-");

  const tieneDecimales = !Number.isInteger(numero);
  return (
    numero.toLocaleString("es-CL", {
      minimumFractionDigits: tieneDecimales ? 1 : 0,
      maximumFractionDigits: tieneDecimales ? 1 : 0
    }) + sufijo
  );
}