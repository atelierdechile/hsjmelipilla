/**
 * DASHBOARD HOSPITALARIO - VERSIÓN PRO (RECOVERY MODE)
 * Solución al problema de visualización vacía y manejo de estados sin datos.
 */

let dataGlobal = null;
let charts = {};
let animaciones = {};

let estado = {
    nivel: null,
    anio: "",
    mes: "",
    glosa: "",
    kpis: {}
};

// ================= INIT =================
document.addEventListener("DOMContentLoaded", init);

async function init() {
    mostrarLoader();
    try {
        await cargarData();
        configurarFiltros();
        configurarPDF();
        // Forzamos un render inicial
        actualizarDashboard();
    } catch (error) {
        console.error("Error en Init:", error);
        mostrarErrorPantalla(error);
    } finally {
        ocultarLoader();
    }
}

async function cargarData() {
    const res = await fetch("./data/rem.json");
    if (!res.ok) throw new Error("No se pudo cargar rem.json");
    dataGlobal = await res.json();
    
    llenarSelectorNiveles(dataGlobal.niveles);
    llenarAnios(dataGlobal.niveles);
    
    // Si no hay nivel seleccionado, tomamos el primero (General)
    if (!estado.nivel) estado.nivel = dataGlobal.niveles[0];
}

// ================= DASHBOARD ENGINE =================
function actualizarDashboard() {
    const nivel = estado.nivel;
    if (!nivel) return;

    // 1. Filtrado de datos
    let datosFiltrados = filtrarEgresos(nivel.egresos);
    
    // 2. Si el filtro es tan estricto que no deja nada, mostramos el acumulado del nivel
    // Esto evita que la pantalla quede en blanco si eliges un mes sin registros.
    const usarAcumulado = datosFiltrados.length === 0;
    const fuenteDatos = usarAcumulado ? [nivel.resumen] : datosFiltrados;

    const sum = (arr, key) => arr.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
    
    // 3. Cálculo de KPIs con fallback
    const altas = sum(fuenteDatos, 'altas');
    const traslados = sum(fuenteDatos, 'traslados');
    const fallecidos = sum(fuenteDatos, 'fallecidos');
    const totalEgresos = altas + traslados + fallecidos;
    
    estado.kpis = {
        dias_cama_disponibles: sum(fuenteDatos, 'dias_cama_disponibles') || nivel.indicadores.dias_cama_disponibles,
        dias_cama_ocupados: sum(fuenteDatos, 'dias_cama_ocupados') || nivel.indicadores.dias_cama_ocupados,
        dias_estada: sum(fuenteDatos, 'dias_estada') || nivel.indicadores.dias_estada,
        egresos_total: totalEgresos || nivel.resumen.egresos_total,
        altas: altas,
        traslados: traslados,
        fallecidos: fallecidos,
        indice_ocupacional: nivel.indicadores.indice_ocupacional,
        letalidad: nivel.resumen.letalidad,
        promedio_estada: nivel.resumen.promedio_estada
    };

    // 4. Renderizado de UI
    renderKPIs(estado.kpis);
    actualizarGraficos(nivel, datosFiltrados.length > 0 ? datosFiltrados : nivel.egresos);
    actualizarGlosas(dataGlobal.glosas_base, estado.kpis);
    
    // Aplicar efectos visuales
    prepararSuperficies();
    configurarInteractividadUI();
    animarEntradaUI();
}

// ================= RENDER HELPERS =================
function renderKPIs(kpis) {
    animarNumero("camasDisponibles", kpis.dias_cama_disponibles);
    animarNumero("camaOcupadas", kpis.dias_cama_ocupados);
    animarNumero("diasEstada", kpis.dias_estada);
    animarNumero("indiceOcupacional", kpis.indice_ocupacional, "%");
}

function actualizarGlosas(glosasBase, kpis) {
    const contenedor = document.getElementById("contenedorGlosas");
    if (!contenedor) return;

    const map = {
        "Altas": kpis.altas,
        "Días Cama Disponibles": kpis.dias_cama_disponibles,
        "Días Cama Ocupados": kpis.dias_cama_ocupados,
        "Días de Estada": kpis.dias_estada,
        "Número de Egresos": kpis.egresos_total,
        "Traslados": kpis.traslados,
        "Letalidad": kpis.letalidad,
        "Promedio Días de Estada": kpis.promedio_estada
    };

    contenedor.innerHTML = glosasBase
        .filter(g => estado.glosa ? g.titulo === estado.glosa : (map[g.titulo] !== undefined))
        .map((glosa, i) => `
            <article class="glosa-item" style="--stagger-index:${i}">
                <div class="glosa-item__header">
                    <h4>${glosa.titulo}</h4>
                    <span class="glosa-item__valor">${formatearValor(map[glosa.titulo])}</span>
                </div>
                <p>${glosa.descripcion}</p>
            </article>
        `).join("");
}

function actualizarGraficos(nivel, egresos) {
    const labels = egresos.map(e => e.mes);
    
    // Egresos (Barras)
    crearGrafico("egresos", "bar", labels, [
        { label: "Altas", data: egresos.map(e => e.altas), backgroundColor: "#10b981" },
        { label: "Traslados", data: egresos.map(e => e.traslados), backgroundColor: "#3b82f6" },
        { label: "Fallecidos", data: egresos.map(e => e.fallecidos), backgroundColor: "#ef4444" }
    ]);

    // Donut de Ocupación
    const ocup = estado.kpis.dias_cama_ocupados;
    const disp = estado.kpis.dias_cama_disponibles;
    const porc = disp > 0 ? ((ocup / disp) * 100).toFixed(1) : 0;
    
    document.getElementById("donutValor").textContent = porc + "%";
    crearGrafico("donut", "doughnut", ["Ocupado", "Disponible"], [{
        data: [ocup, Math.max(0, disp - ocup)],
        backgroundColor: ["#3b82f6", "#f1f5f9"]
    }], { cutout: "70%" });
}

function crearGrafico(id, tipo, labels, datasets, extra = {}) {
    const canvas = document.getElementById("grafico" + id.charAt(0).toUpperCase() + id.slice(1));
    if (!canvas) return;

    if (charts[id]) charts[id].destroy();
    
    charts[id] = new Chart(canvas, {
        type: tipo,
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            ...extra
        }
    });
}

// ================= FILTROS Y UTILS =================
function filtrarEgresos(egresos) {
    if (!egresos) return [];
    return egresos.filter(e => {
        const [a, m] = e.mes.split("-");
        const matchAnio = !estado.anio || a === estado.anio;
        const matchMes = !estado.mes || m === estado.mes;
        return matchAnio && matchMes;
    });
}

function animarNumero(id, valor, sufijo = "") {
    const el = document.getElementById(id);
    if (!el) return;
    const final = Number(valor) || 0;
    el.textContent = final.toLocaleString("es-CL") + sufijo;
}

function formatearValor(v) {
    if (v === undefined || v === null) return "0";
    return Number(v).toLocaleString("es-CL", { maximumFractionDigits: 1 });
}

function llenarSelectorNiveles(niveles) {
    const sel = document.getElementById("selectorNivel");
    if (sel) sel.innerHTML = niveles.map(n => `<option value="${n.codigo}">${n.nombre}</option>`).join("");
}

function llenarAnios(niveles) {
    const sel = document.getElementById("selectorAnio");
    if (!sel) return;
    const anios = [...new Set(niveles.flatMap(n => n.egresos.map(e => e.mes.split("-")[0])))];
    sel.innerHTML = `<option value="">Todos los años</option>` + anios.map(a => `<option value="${a}">${a}</option>`).join("");
}

function configurarFiltros() {
    const selectores = {
        "selectorNivel": "nivel",
        "selectorAnio": "anio",
        "selectorMes": "mes",
        "selectorGlosa": "glosa"
    };

    Object.entries(selectores).forEach(([id, campo]) => {
        document.getElementById(id)?.addEventListener("change", (e) => {
            if (campo === "nivel") {
                estado.nivel = dataGlobal.niveles.find(n => n.codigo == e.target.value);
            } else {
                estado[campo] = e.target.value;
            }
            actualizarDashboard();
        });
    });
}

function mostrarLoader() { document.getElementById("loader")?.classList.remove("hidden"); }
function ocultarLoader() { document.getElementById("loader")?.classList.add("hidden"); }
function prepararSuperficies() { /* Add interactive classes if needed */ }
function configurarInteractividadUI() { /* Perspective effects */ }
function configurarPDF() { /* Print function */ }
function animarEntradaUI() { /* Fade in effects */ }
function mostrarErrorPantalla(e) { alert("Error: " + e.message); }