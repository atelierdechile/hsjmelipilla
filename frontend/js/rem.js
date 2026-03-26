let dataGlobal = null;
let charts = {};
let animaciones = {};
let intervalDonut = null;
let rafPointer = null;

// Agregamos glosa y kpis al estado global para los filtros cruzados
let estado = {
  nivel: null,
  anio: "",
  mes: "",
  glosa: "",
  kpis: {}
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
  const elementos = [];
  document.querySelectorAll(".kpi").forEach(el => elementos.push(el));
  
  SELECTORES_ANIMABLES.chartCards.forEach(selector => {
    const card = document.querySelector(selector)?.closest(".card");
    if (card) elementos.push(card);
  });
  
  elementos.forEach((el, i) => dispararReveal(el, i * 55));
  revelarItems("#contenedorGlosas .glosa-item", 85);
  revelarItems("#resumenIndicadores .resumen-item", 70);
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
function mostrarLoader() { document.getElementById("loader")?.classList.remove("hidden"); }
function ocultarLoader() { setTimeout(() => document.getElementById("loader")?.classList.add("hidden"), 800); }

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

  document.getElementById("selectorNivel")?.addEventListener("change", (e) => {
    estado.nivel = dataGlobal.niveles.find(n => n.codigo == e.target.value);
    actualizarDashboard();
  });

  // Evento para el nuevo filtro de Glosas
  document.getElementById("selectorGlosa")?.addEventListener("change", (e) => {
    estado.glosa = e.target.value;
    // Solo actualizamos las glosas (con animación rápida) sin recargar todo el dashboard
    actualizarGlosas(dataGlobal.glosas_base, estado.kpis);
    revelarItems("#contenedorGlosas .glosa-item", 40);
  });
}

function llenarSelector(niveles) {
  const selector = document.getElementById("selectorNivel");
  if (!selector) return;
  selector.innerHTML = niveles.map(n => `<option value="${n.codigo}">${n.nombre}</option>`).join("");
}

function llenarAnios(niveles) {
  const selector = document.getElementById("selectorAnio");
  if (!selector) return;

  const anios = new Set();
  niveles.forEach(n => n.egresos.forEach(e => anios.add(e.mes.split("-")[0])));

  selector.innerHTML = `<option value="">Todos los años</option>` + 
    [...anios].sort((a,b) => b-a).map(a => `<option value="${a}">${a}</option>`).join("");
}

function filtrarEgresos(egresos) {
  return egresos.filter(e => {
    const [anio, mes] = e.mes.split("-");
    if (estado.anio && anio !== estado.anio) return false;
    if (estado.mes && mes !== estado.mes) return false;
    return true;
  });
}

// ================= DASHBOARD DINÁMICO =================
function actualizarDashboard() {
  const nivel = estado.nivel;
  if (!nivel || !dataGlobal) return;

  const egresosFiltrados = filtrarEgresos(nivel.egresos);
  const sum = (arr, key) => arr.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
  
  let kpis = {};
  
  const tieneCamas = egresosFiltrados.some(e => e.dias_cama_disponibles !== undefined);

  if (tieneCamas) {
    const disp = sum(egresosFiltrados, 'dias_cama_disponibles');
    const ocup = sum(egresosFiltrados, 'dias_cama_ocupados');
    const estada = sum(egresosFiltrados, 'dias_estada');
    const altas = sum(egresosFiltrados, 'altas');
    const traslados = sum(egresosFiltrados, 'traslados');
    const fallecidos = sum(egresosFiltrados, 'fallecidos');
    const totalEgresos = altas + traslados + fallecidos;

    kpis = {
      dias_cama_disponibles: disp > 0 ? disp : nivel.indicadores.dias_cama_disponibles,
      dias_cama_ocupados: ocup > 0 ? ocup : nivel.indicadores.dias_cama_ocupados,
      dias_estada: estada > 0 ? estada : nivel.indicadores.dias_estada,
      indice_ocupacional: disp > 0 ? ((ocup / disp) * 100) : 0,
      indice_rotacion: nivel.indicadores.indice_rotacion, 
      letalidad: totalEgresos > 0 ? ((fallecidos / totalEgresos) * 100) : 0,
      egresos_total: totalEgresos,
      promedio_camas: nivel.resumen.promedio_camas, 
      promedio_estada: totalEgresos > 0 ? (estada / totalEgresos) : 0,
      traslados: traslados,
      fallecidos: fallecidos,
      altas: altas // Agregado para la glosa
    };
  } else {
    const altas = sum(egresosFiltrados, 'altas');
    const traslados = sum(egresosFiltrados, 'traslados');
    const fallecidos = sum(egresosFiltrados, 'fallecidos');
    const totalEgresos = altas + traslados + fallecidos;

    kpis = {
      dias_cama_disponibles: nivel.indicadores.dias_cama_disponibles,
      dias_cama_ocupados: nivel.indicadores.dias_cama_ocupados,
      dias_estada: nivel.indicadores.dias_estada,
      indice_ocupacional: nivel.indicadores.indice_ocupacional,
      indice_rotacion: nivel.indicadores.indice_rotacion,
      letalidad: nivel.resumen.letalidad,
      egresos_total: totalEgresos || nivel.resumen.egresos_total,
      promedio_camas: nivel.resumen.promedio_camas,
      promedio_estada: nivel.resumen.promedio_estada,
      traslados: traslados || nivel.resumen.traslados,
      fallecidos: fallecidos,
      altas: altas // Agregado para la glosa
    };
  }

  // Guardamos los kpis calculados en el estado global
  estado.kpis = kpis;

  // Actualizamos KPIs Superiores
  animarNumero("camasDisponibles", kpis.dias_cama_disponibles);
  animarNumero("camaOcupadas", kpis.dias_cama_ocupados);
  animarNumero("diasEstada", kpis.dias_estada);
  animarNumero("indiceOcupacional", kpis.indice_ocupacional, "%");

  actualizarNivelCuidado(nivel.nivel_cuidado);
  
  actualizarGraficos(nivel, egresosFiltrados, kpis);
  actualizarGlosas(dataGlobal.glosas_base, kpis);
  renderResumen(kpis);
  
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
  const step = numero / 30;

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

function actualizarNivelCuidado(nivel) {
  const el = document.getElementById("nivelCuidado");
  if (!el || !nivel) return;
  el.textContent = nivel.tipo || "Sin nivel";
  el.className = "nivel-cuidado " + (nivel.color || "primary");
}

// ================= CHART ENGINE =================
function crearGrafico(id, tipo, labels, datasets, extra = {}, sufijoY = "") {
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
      interaction: { mode: esDonut ? "nearest" : "index", intersect: false },
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 10 } },
        tooltip: { backgroundColor: "rgba(15, 23, 42, 0.92)", titleColor: "#ffffff", padding: 12 }
      },
      animation: { duration: 1000, easing: "easeOutQuart" },
      elements: {
        line: { tension: 0.35, borderWidth: 3 },
        point: { radius: 0, hoverRadius: 6 },
        bar: { borderRadius: esBarra ? 6 : 0 }
      },
      scales: esDonut ? {} : {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "rgba(148, 163, 184, 0.15)" }, ticks: { callback: v => v + sufijoY } }
      },
      ...extra
    }
  });
}

function capitalizar(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

// ================= GRAFICOS =================
function actualizarGraficos(nivel, egresos, kpis) {
  const labels = egresos.map(e => formatearMes(e.mes));

  crearGrafico("egresos", "bar", labels, [
    { label: "Altas", data: egresos.map(e => e.altas), backgroundColor: "#10b981" },
    { label: "Traslados", data: egresos.map(e => e.traslados), backgroundColor: "#3b82f6" },
    { label: "Fallecidos", data: egresos.map(e => e.fallecidos), backgroundColor: "#ef4444" }
  ]);

  actualizarDonut(kpis);

  const dataLetalidad = egresos.map(e => {
    const total = (e.altas || 0) + (e.traslados || 0) + (e.fallecidos || 0);
    return total ? Number(((e.fallecidos / total) * 100).toFixed(1)) : 0;
  });
  crearGrafico("letalidad", "line", labels, [{
    label: "Letalidad %", data: dataLetalidad, borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.15)", fill: true
  }], { plugins: { legend: { display: false } } }, "%");

  const promedio = Number(kpis.promedio_estada) || 0;
  crearGrafico("estada", "line", labels, [{
    label: "Prom. Estada", data: egresos.map(() => promedio), borderColor: "#8b5cf6", backgroundColor: "rgba(139, 92, 246, 0.15)", fill: true
  }], { plugins: { legend: { display: false } } }, " d");

  crearGrafico("camas", "bar", ["Disponibles", "Ocupados"], [{
    label: "Camas",
    data: [kpis.dias_cama_disponibles, kpis.dias_cama_ocupados],
    backgroundColor: ["#10b981", "#3b82f6"]
  }], { plugins: { legend: { display: false } } }); 
}

function actualizarDonut(kpis) {
  if (intervalDonut) clearInterval(intervalDonut);

  const ocupados = Number(kpis.dias_cama_ocupados) || 0;
  const total = Number(kpis.dias_cama_disponibles) || 0;
  const libres = Math.max(total - ocupados, 0);
  const porcentaje = total > 0 ? (ocupados / total) * 100 : 0;

  let colorOcupado = "#10b981"; 
  if (porcentaje >= 90) colorOcupado = "#ef4444"; 
  else if (porcentaje >= 80) colorOcupado = "#f59e0b";

  animarDonutTexto("donutValor", porcentaje);

  crearGrafico("donut", "doughnut", ["Ocupados", "Libres"], [{
    data: [ocupados, libres], backgroundColor: [colorOcupado, "#e2e8f0"], borderWidth: 0
  }], { cutout: "70%", plugins: { legend: { display: false } } });
}

function animarDonutTexto(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  let actual = 0;
  el.classList.remove("is-visible");
  intervalDonut = setInterval(() => {
    actual += (valor / 25) || valor;
    if (actual >= valor) {
      actual = valor;
      clearInterval(intervalDonut);
      el.classList.add("is-visible");
    }
    el.textContent = actual.toFixed(1) + "%";
  }, 16);
}

// ================= GLOSAS Y RESUMEN =================
function actualizarGlosas(glosasBase, kpis) {
  const contenedor = document.getElementById("contenedorGlosas");
  if (!contenedor) return;

  const map = {
    "Altas": kpis.altas,
    "Días Cama Disponibles": kpis.dias_cama_disponibles,
    "Días Cama Ocupados": kpis.dias_cama_ocupados,
    "Días de Estada": kpis.dias_estada,
    "Índice Ocupacional": formatearValor(kpis.indice_ocupacional, "%"),
    "Índice de Rotación": kpis.indice_rotacion,
    "Letalidad": formatearValor(kpis.letalidad, "%"),
    "Número de Egresos": kpis.egresos_total,
    "Promedio Cama Disponibles": kpis.promedio_camas,
    "Promedio Días de Estada": kpis.promedio_estada,
    "Traslados": kpis.traslados,
    "Egresos Fallecidos": kpis.fallecidos
  };

  // Inyectar opciones en el <select> solo la primera vez para no perder la opción elegida
  const selector = document.getElementById("selectorGlosa");
  if (selector && selector.options.length <= 1) {
    const glosasOrdenadas = [...glosasBase].sort((a, b) => a.titulo.localeCompare(b.titulo));
    selector.innerHTML = `<option value="">Todas las Glosas</option>` + 
      glosasOrdenadas.map(g => `<option value="${g.titulo}">${g.titulo}</option>`).join("");
  }

  // Lógica del filtro
  const glosasFiltradas = estado.glosa 
    ? glosasBase.filter(g => g.titulo === estado.glosa) 
    : glosasBase;

  contenedor.innerHTML = glosasFiltradas.map((glosa, index) => `
    <article class="glosa-item" style="--stagger-index:${index}">
      <div class="glosa-item__header">
        <h4>${glosa.titulo}</h4>
        <span class="glosa-item__valor">${formatearValor(map[glosa.titulo] || "-")}</span>
      </div>
      <p>${glosa.descripcion}</p>
    </article>
  `).join("");
}

function renderResumen(kpis) {
  const contenedor = document.getElementById("resumenIndicadores");
  if (!contenedor) return;

  const items = [
    ["Letalidad", `${formatearValor(kpis.letalidad)}%`],
    ["Egresos totales", kpis.egresos_total],
    ["Promedio camas", kpis.promedio_camas],
    ["Promedio estada", `${formatearValor(kpis.promedio_estada)} d`],
    ["Traslados", kpis.traslados],
    ["Fallecidos", kpis.fallecidos]
  ];

  contenedor.innerHTML = items.map(([label, value], i) => `
    <div class="resumen-item" style="--stagger-index:${i}">
      <span>${label}</span><strong>${value}</strong>
    </div>
  `).join("");
}

// ================= UI INTERACTIVA & EXPORTACIÓN =================
function prepararSuperficies() {
  document.querySelectorAll(".kpi, .chart-card, .glosas").forEach(el => el.classList.add("interactive-surface"));
}

function configurarInteractividadUI() {
  document.querySelectorAll(".interactive-surface").forEach(el => {
    if (el.dataset.interactiveReady === "true") return;
    el.dataset.interactiveReady = "true";

    el.addEventListener("mousemove", (event) => {
      if (rafPointer) cancelAnimationFrame(rafPointer);
      rafPointer = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const rotateX = (((event.clientY - rect.top) / rect.height) - 0.5) * -5;
        const rotateY = (((event.clientX - rect.left) / rect.width) - 0.5) * 5;
        el.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
      });
    });

    el.addEventListener("mouseleave", () => {
      el.style.removeProperty("transform");
    });
  });
}

function configurarPDF() {
  document.getElementById("btnExportarPDF")?.addEventListener("click", () => window.print());
}

// ================= HELPERS =================
function formatearMes(valor) {
  if (!valor || !valor.includes("-")) return valor;
  const [anio, mes] = valor.split("-");
  return new Date(anio, mes - 1, 1).toLocaleDateString("es-CL", { month: "short", year: "numeric" });
}

function formatearValor(valor, sufijo = "") {
  if (typeof valor === "string") return valor;
  const num = Number(valor);
  if (isNaN(num)) return "-";
  const tieneDecimales = !Number.isInteger(num);
  return num.toLocaleString("es-CL", { minimumFractionDigits: tieneDecimales ? 1 : 0, maximumFractionDigits: 1 }) + sufijo;
}