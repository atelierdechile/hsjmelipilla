import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { ChartCanvas } from "../components/ChartCanvas";
import { fetchHospitalData, MONTH_OPTIONS, monthLabel, sum } from "../lib/data";

export function RemPage() {
  const [data, setData] = useState(null);
  const [nivelCodigo, setNivelCodigo] = useState("");
  const [anio, setAnio] = useState("");
  const [mes, setMes] = useState("");
  const [glosa, setGlosa] = useState("");

  useEffect(() => {
    fetchHospitalData().then((json) => {
      setData(json);
      setNivelCodigo(json.niveles[0].codigo);
      setAnio("2025");
    });
  }, []);

  const nivel = useMemo(() => data?.niveles.find((item) => item.codigo === nivelCodigo), [data, nivelCodigo]);
  const filtered = useMemo(() => {
    if (!nivel) return [];
    return nivel.egresos.filter((item) => {
      const [currentYear, currentMonth] = item.mes.split("-");
      return (!anio || currentYear === anio) && (!mes || currentMonth === mes);
    });
  }, [anio, mes, nivel]);

  const hasActiveFilters = Boolean(anio || mes);
  const source = hasActiveFilters ? filtered : nivel?.egresos || [];
  const kpis = useMemo(() => {
    if (!nivel) return null;
    const disponibles = sum(source, "dias_cama_disponibles");
    const ocupados = sum(source, "dias_cama_ocupados");
    const diasEstada = sum(source, "dias_estada");
    const altas = sum(source, "altas");
    const fallecidos = sum(source, "fallecidos");
    const traslados = sum(source, "traslados");
    const numeroEgresos = altas + fallecidos + traslados;
    return {
      dias_cama_disponibles: disponibles,
      dias_cama_ocupados: ocupados,
      dias_estada: diasEstada,
      indice_ocupacional: disponibles ? (ocupados / disponibles) * 100 : 0,
      promedio_camas: disponibles / 30,
      numero_egresos: numeroEgresos,
      fallecidos,
      letalidad: numeroEgresos ? (fallecidos / numeroEgresos) * 100 : 0,
      promedio_estada: numeroEgresos ? diasEstada / numeroEgresos : 0,
      indice_rotacion: disponibles ? numeroEgresos / (disponibles / 30) : 0,
      traslados,
      altas,
    };
  }, [nivel, source]);

  if (!data || !nivel || !kpis) return <AppShell title="Gestión REM - Nivel de Cuidado">Cargando...</AppShell>;

  const years = [...new Set(data.niveles.flatMap((item) => item.egresos.map((egreso) => egreso.mes.split("-")[0])))];
  const glosas = glosa ? data.glosas_base.filter((item) => item.clave === glosa) : data.glosas_base;
  const currentGlosa = data.glosas_base.find((item) => item.clave === glosa);
  const chartLabels = source.map((item) => {
    if (anio) {
      return monthLabel(item.mes);
    }

    const [year] = item.mes.split("-");
    return `${monthLabel(item.mes)} ${year}`;
  });

  return (
    <AppShell title="Gestión REM - Nivel de Cuidado" actions={<div className="filters"><select value={anio} onChange={(e) => setAnio(e.target.value)}><option value="">Todos</option>{years.map((value) => <option key={value} value={value}>{value}</option>)}</select><select value={mes} onChange={(e) => setMes(e.target.value)}><option value="">Todos los meses</option>{MONTH_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select value={nivelCodigo} onChange={(e) => setNivelCodigo(e.target.value)}>{data.niveles.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}</select><select value={glosa} onChange={(e) => setGlosa(e.target.value)}><option value="">Todas las glosas</option>{data.glosas_base.map((item) => <option key={item.clave} value={item.clave}>{item.titulo}</option>)}</select></div>}>
      <section className="kpis">
        <div className="kpi kpi-disponibles"><h4>Días disponibles</h4><strong>{Math.round(kpis.dias_cama_disponibles).toLocaleString("es-CL")}</strong></div>
        <div className="kpi kpi-ocupados"><h4>Días ocupados</h4><strong>{Math.round(kpis.dias_cama_ocupados).toLocaleString("es-CL")}</strong></div>
        <div className="kpi kpi-estada"><h4>Días de estadía</h4><strong>{Math.round(kpis.dias_estada).toLocaleString("es-CL")}</strong></div>
        <div className="kpi kpi-indice"><h4>Índice ocupacional</h4><strong>{kpis.indice_ocupacional.toFixed(1)}%</strong></div>
      </section>

      <section className="dashboard-layout">
        <div className="main-content">
          <section className="card-glosa-dinamica"><h3 id="tituloGlosa">{currentGlosa?.titulo || "Selecciona una glosa"}</h3><div id="valorGlosa">{currentGlosa ? Math.round(kpis[currentGlosa.clave] || 0).toLocaleString("es-CL") : "--"}</div><p id="descGlosa">{currentGlosa?.descripcion || "Aquí verás el detalle del indicador"}</p></section>
          <section className="chart-full"><h3>Número de egresos</h3><div className="chart-container"><ChartCanvas type="bar" data={{ labels: chartLabels, datasets: [{ label: "Altas", data: source.map((item) => item.altas), backgroundColor: "#3b82f6" }, { label: "Fallecidos", data: source.map((item) => item.fallecidos), backgroundColor: "#ef4444" }] }} options={{ responsive: true, maintainAspectRatio: false }} /></div></section>
          <section className="chart-full"><h3>Distribución de ocupación</h3><div className="chart-donut-container"><ChartCanvas type="doughnut" data={{ labels: ["Ocupado", "Libre"], datasets: [{ data: [kpis.dias_cama_ocupados, Math.max(0, kpis.dias_cama_disponibles - kpis.dias_cama_ocupados)], backgroundColor: ["#3b82f6", "#f43f5e"] }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: "65%" }} /></div></section>
          <section className="chart-full"><h3>Evolución índice ocupacional</h3><div className="chart-container"><ChartCanvas type="line" data={{ labels: chartLabels, datasets: [{ label: "Índice ocupacional %", data: source.map((item) => item.dias_cama_disponibles ? Math.round((item.dias_cama_ocupados / item.dias_cama_disponibles) * 100) : 0), borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.2)", tension: 0.4, fill: true }] }} options={{ responsive: true, maintainAspectRatio: false }} /></div></section>
        </div>

        <aside className="sidebar-glosas"><div className="glosas-header"><h3>Glosas</h3></div><div id="contenedorGlosas">{glosas.map((item) => <div key={item.clave} className="glosa-item fade-in"><h4>{item.titulo}</h4><strong>{Math.round(kpis[item.clave] || 0).toLocaleString("es-CL")}</strong><p>{item.descripcion}</p></div>)}</div></aside>
      </section>
    </AppShell>
  );
}
