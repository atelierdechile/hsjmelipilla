import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { ChartCanvas } from "../components/ChartCanvas";
import { fetchHospitalData, sum } from "../lib/data";

export function DashboardPage() {
  const [hospital, setHospital] = useState(null);

  useEffect(() => {
    fetchHospitalData().then((json) => setHospital(json.niveles));
  }, []);

  const view = useMemo(() => {
    if (!hospital) return null;
    const total = hospital.find((item) => item.codigo === "0") || hospital[0];
    const services = hospital.filter((item) => item.codigo !== "0");
    const ocupacion = (sum(total.egresos, "dias_cama_ocupados") / sum(total.egresos, "dias_cama_disponibles")) * 100;
    return { total, services, ocupacion, egresos: total.egresos };
  }, [hospital]);

  if (!view) return <AppShell title="Dashboard Hospitalario">Cargando...</AppShell>;

  const totalEgresos = sum(view.egresos, "altas") + sum(view.egresos, "fallecidos");
  const promedioEstada = totalEgresos ? sum(view.egresos, "dias_estada") / totalEgresos : 0;
  const indiceRotacion = sum(view.egresos, "dias_cama_disponibles") ? totalEgresos / (sum(view.egresos, "dias_cama_disponibles") / 30) : 0;
  const letalidad = totalEgresos ? (sum(view.egresos, "fallecidos") / totalEgresos) * 100 : 0;
  const critical = view.services.filter((service) => ((sum(service.egresos, "dias_cama_ocupados") / sum(service.egresos, "dias_cama_disponibles")) * 100) > 90);

  return (
    <AppShell title="Dashboard Hospitalario">
      <section className="kpis">
        <div className="card kpi primary"><span>INDICE OCUPACIONAL</span><h2>{view.ocupacion.toFixed(1)}%</h2></div>
        <div className="card kpi green"><span>PROM. DIAS ESTADA</span><h2>{promedioEstada.toFixed(1)}</h2></div>
        <div className="card kpi orange"><span>INDICE DE ROTACION</span><h2>{indiceRotacion.toFixed(1)}</h2></div>
        <div className="card kpi red"><span>TASA LETALIDAD</span><h2>{letalidad.toFixed(1)}%</h2></div>
      </section>

      <section className="grid-2">
        <div className="card">
          <h3>Egresos</h3>
          <div className="chart-container">
            <ChartCanvas type="bar" data={{ labels: view.egresos.map((item) => item.mes), datasets: [
              { label: "Altas", data: view.egresos.map((item) => item.altas), backgroundColor: "#10b981" },
              { label: "Traslados", data: view.egresos.map((item) => item.traslados), backgroundColor: "#3b82f6" },
              { label: "Fallecidos", data: view.egresos.map((item) => item.fallecidos), backgroundColor: "#ef4444" },
            ] }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="card">
          <h3>Distribucion</h3>
          <div className="chart-container">
            <ChartCanvas type="doughnut" data={{ labels: view.services.slice(0, 4).map((item) => item.nombre), datasets: [{ data: view.services.slice(0, 4).map((item) => sum(item.egresos, "dias_cama_ocupados")), backgroundColor: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"] }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: "70%" }} />
          </div>
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <h3>Ocupacion por Servicio</h3>
          <div id="contenedorBarrasServicio">
            {view.services.map((service) => {
              const ratio = (sum(service.egresos, "dias_cama_ocupados") / sum(service.egresos, "dias_cama_disponibles")) * 100;
              const color = ratio >= 90 ? "red" : ratio >= 75 ? "orange" : "green";
              return <div key={service.codigo} className="bar-group"><p>{service.nombre} <strong>{ratio.toFixed(1)}%</strong></p><div className="bar"><div className={`fill ${color}`} style={{ width: `${ratio}%` }} /></div></div>;
            })}
          </div>
        </div>

        <div className="card alerts" id="contenedorAlertas">
          <h3>Alertas</h3>
          {critical.length === 0 ? <div className="alert green">Sistema estable</div> : null}
          {critical.map((service) => {
            const ratio = (sum(service.egresos, "dias_cama_ocupados") / sum(service.egresos, "dias_cama_disponibles")) * 100;
            return <div key={service.codigo} className="alert red">{service.nombre} critico ({ratio.toFixed(1)}%)</div>;
          })}
        </div>
      </section>
    </AppShell>
  );
}
