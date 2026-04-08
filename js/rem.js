// =========================
// INIT GLOBAL
// =========================
document.addEventListener("DOMContentLoaded", () => {
    if (!window.location.pathname.includes("rem.html")) return;
    init();
});

// ================= VARIABLES =================
let dataGlobal = null;
let charts = {};

const selectorNivel = document.getElementById("selectorNivel");
const selectorAnio = document.getElementById("selectorAnio");
const selectorMes = document.getElementById("selectorMes");
const selectorGlosa = document.getElementById("selectorGlosa");

const contenedorGlosas = document.getElementById("contenedorGlosas");

const graficoEgresos = document.getElementById("graficoEgresos");
const graficoDonut = document.getElementById("graficoDonut");
const graficoLinea = document.getElementById("graficoLinea");

let estado = {
    nivel: null,
    anio: "",
    mes: "",
    glosa: "",
    kpis: {}
};

// ================= INIT =================
async function init() {
    await cargarData();
    configurarFiltros();
}

// ================= DATA =================
async function cargarData() {
    const res = await fetch("./data/rem.json");
    dataGlobal = await res.json();

    llenarSelector();
    llenarAnios();
    llenarMeses();
    llenarSelectorGlosas();

    estado.nivel = dataGlobal.niveles[0];

    actualizarDashboard();
}

// ================= SELECTORES =================
function llenarSelector() {
    selectorNivel.innerHTML =
        dataGlobal.niveles.map(n =>
            `<option value="${n.codigo}">${n.nombre}</option>`
        ).join("");
}

function llenarAnios() {
    const anios = [...new Set(
        dataGlobal.niveles.flatMap(n =>
            n.egresos.map(e => e.mes.split("-")[0])
        )
    )];

    selectorAnio.innerHTML =
        `<option value="">Todos</option>` +
        anios.map(a => `<option>${a}</option>`).join("");
}

function llenarMeses() {
    const meses = [...new Set(
        dataGlobal.niveles.flatMap(n =>
            n.egresos.map(e => e.mes.split("-")[1])
        )
    )].sort();

    const nombresMes = {
        "01": "Enero","02": "Febrero","03": "Marzo","04": "Abril",
        "05": "Mayo","06": "Junio","07": "Julio","08": "Agosto",
        "09": "Septiembre","10": "Octubre","11": "Noviembre","12": "Diciembre"
    };

    selectorMes.innerHTML =
        `<option value="">Todos</option>` +
        meses.map(m => `<option value="${m}">${nombresMes[m]}</option>`).join("");
}

function llenarSelectorGlosas() {
    selectorGlosa.innerHTML =
        `<option value="">Todas las glosas</option>` +
        dataGlobal.glosas_base.map(g =>
            `<option value="${g.clave}">${g.titulo}</option>`
        ).join("");
}

// ================= FILTROS =================
function configurarFiltros() {

    selectorNivel.onchange = e => {
        estado.nivel = dataGlobal.niveles.find(n => n.codigo == e.target.value);
        animarCambio();
        actualizarDashboard();
    };

    selectorAnio.onchange = e => {
        estado.anio = e.target.value;
        animarCambio();
        actualizarDashboard();
    };

    selectorMes.onchange = e => {
        estado.mes = e.target.value;
        animarCambio();
        actualizarDashboard();
    };

    selectorGlosa.onchange = e => {
        estado.glosa = e.target.value;
        actualizarGlosas();
        actualizarCardGlosa();
    };
}

// ================= DASHBOARD =================
function actualizarDashboard() {

    if (!estado.nivel) return;

    const egresos = filtrarEgresos(estado.nivel.egresos);

    const sum = (k) => egresos.reduce((a,b)=>a+(b[k]||0),0);

    const disp = sum("dias_cama_disponibles");
    const ocup = sum("dias_cama_ocupados");
    const dias = sum("dias_estada");
    const altas = sum("altas");
    const fallecidos = sum("fallecidos");
    const traslados = sum("traslados");

    const totalEgresos = altas + fallecidos;

    estado.kpis = {
        dias_cama_disponibles: disp,
        dias_cama_ocupados: ocup,
        dias_estada: dias,

        indice_ocupacional: disp ? (ocup / disp) * 100 : 0,
        letalidad: totalEgresos ? (fallecidos / totalEgresos) * 100 : 0,

        altas,
        fallecidos,
        traslados,
        numero_egresos: totalEgresos,
        promedio_camas: disp ? (disp / 30) : 0,
        promedio_estada: totalEgresos ? (dias / totalEgresos) : 0,
        indice_rotacion: disp ? (totalEgresos / (disp / 30)) : 0
    };

    set("camasDisponibles", disp);
    set("camaOcupadas", ocup);
    set("diasEstada", dias);
    set("indiceOcupacional", estado.kpis.indice_ocupacional, "%");

    pintarKPIColor();

    actualizarNivelUI();
    actualizarGraficos(egresos);
    actualizarDonut();
    actualizarGraficoLinea(egresos);
    actualizarGlosas();
    actualizarCardGlosa();
}

// ================= FILTRO =================
function filtrarEgresos(arr){
    return arr.filter(e=>{
        const [anio, mes] = e.mes.split("-");
        return (!estado.anio || anio === estado.anio) &&
               (!estado.mes || parseInt(mes) === parseInt(estado.mes));
    });
}

// ================= KPI COLOR =================
function pintarKPIColor(){
    const indice = estado.kpis.indice_ocupacional;
    const el = document.getElementById("indiceOcupacional");

    if (!el) return;

    if(indice > 90) el.style.color = "#ef4444";
    else if(indice > 70) el.style.color = "#f59e0b";
    else el.style.color = "#10b981";
}

// ================= GLOSAS =================
function actualizarGlosas(){

    if(!dataGlobal || !dataGlobal.glosas_base) return;

    let glosas = dataGlobal.glosas_base;

    if(estado.glosa){
        glosas = glosas.filter(g => g.clave === estado.glosa);
    }

    contenedorGlosas.innerHTML = glosas.map(g => `
        <div class="glosa-item fade-in">
            <h4>${g.titulo}</h4>
            <strong>${formatearGlosa(g.clave)}</strong>
            <p>${g.descripcion}</p>
        </div>
    `).join("");
}

function formatearGlosa(clave){
    const val = estado.kpis[clave];
    if(val === undefined) return "--";

    if(clave.includes("indice") || clave.includes("letalidad")){
        return Math.round(val) + "%";
    }

    return Math.round(val).toLocaleString("es-CL");
}

function actualizarCardGlosa(){
    const titulo = document.getElementById("tituloGlosa");
    const valor = document.getElementById("valorGlosa");
    const desc = document.getElementById("descGlosa");

    if (!estado.glosa) {
        titulo.innerText = "Selecciona una glosa";
        valor.innerText = "--";
        desc.innerText = "Aquí verás el detalle del indicador";
        return;
    }

    const g = dataGlobal.glosas_base.find(x => x.clave === estado.glosa);
    if (!g) return;

    titulo.innerText = g.titulo;
    valor.innerText = formatearGlosa(g.clave);
    desc.innerText = g.descripcion;
}

// ================= GRAFICOS =================
const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800 }
};

function actualizarGraficos(egresos){
    if(charts.bar) charts.bar.destroy();

    charts.bar = new Chart(graficoEgresos,{
        type:"bar",
        data:{
            labels: egresos.map(e=>e.mes),
            datasets:[
                { label:"Altas", data:egresos.map(e=>e.altas), backgroundColor:"#3b82f6" },
                { label:"Fallecidos", data:egresos.map(e=>e.fallecidos), backgroundColor:"#ef4444" }
            ]
        },
        options: baseOptions
    });
}

function actualizarDonut(){
    if(charts.donut) charts.donut.destroy();

    const disp = estado.kpis.dias_cama_disponibles || 1;
    const ocup = estado.kpis.dias_cama_ocupados || 0;

    charts.donut = new Chart(graficoDonut,{
        type:"doughnut",
        data:{
            labels:["Ocupado","Libre"],
            datasets:[{
                data:[ocup, disp-ocup],
                backgroundColor:["#3b82f6","#f43f5e"]
            }]
        },
        options: {
            ...baseOptions,
            cutout: "65%"
        }
    });
}

function actualizarGraficoLinea(egresos){
    if(charts.line) charts.line.destroy();

    charts.line = new Chart(graficoLinea, {
        type: "line",
        data: {
            labels: egresos.map(e => e.mes),
            datasets: [{
                label: "Índice Ocupacional %",
                data: egresos.map(e =>
                    Math.round((e.dias_cama_ocupados / e.dias_cama_disponibles) * 100)
                ),
                borderColor: "#10b981",
                backgroundColor: "rgba(16,185,129,0.2)",
                tension: 0.4,
                fill: true
            }]
        },
        options: baseOptions
    });
}

// ================= UI =================
function actualizarNivelUI() {
    const badge = document.getElementById("nivelBadge");
    if (!estado.nivel) return;

    const tipo = estado.nivel.nivel_cuidado?.tipo || "General";

    const iconos = {
        "General": "🏥",
        "Básico": "🛏️",
        "Medio": "⚕️",
        "Crítico": "🚨"
    };

    badge.innerText = `${iconos[tipo]} ${estado.nivel.nombre} • ${tipo}`;
}

function animarCambio(){
    const main = document.querySelector(".main");

    main.style.transition = "all 0.25s ease";
    main.style.opacity = 0.5;
    main.style.transform = "scale(0.98)";

    setTimeout(()=>{
        main.style.opacity = 1;
        main.style.transform = "scale(1)";
    }, 200);
}

function set(id, valor, sufijo="") {
    const el = document.getElementById(id);
    if (!el) return;

    el.innerText = Math.round(valor).toLocaleString("es-CL") + sufijo;
}