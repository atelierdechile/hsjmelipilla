// src/pages/IndicadoresServiciosPage.jsx
import { useMemo } from "react";
import { AppShell } from "../components/AppShell";
import { ChartCanvas } from "../components/ChartCanvas";
import { indicadoresServicios } from "../lib/indicadoresServiciosData";

export function IndicadoresServiciosPage() {
  const chartData = useMemo(() => {
    // Ordenamos de mayor a menor egreso para el gráfico
    const sorted = [...indicadoresServicios].sort((a, b) => b.egresos - a.egresos);
    return {
      labels: sorted.map((item) => item.servicio),
      datasets: [
        {
          label: "Cantidad de Egresos",
          data: sorted.map((item) => item.egresos),
          backgroundColor: "#3b82f6",
        },
      ],
    };
  }, []);

  return (
    <AppShell title="Indicadores Servicios Clínicos" status="Datos 2025">
      <section className="grid-1" style={{ marginBottom: "2rem" }}>
        <div className="card">
          <h3>Volumen de Egresos por Servicio Clínico</h3>
          <div className="chart-container" style={{ height: "300px" }}>
            <ChartCanvas 
              type="bar" 
              data={chartData} 
              options={{ responsive: true, maintainAspectRatio: false }} 
            />
          </div>
        </div>
      </section>

      <section className="grid-1">
        <div className="card" style={{ overflowX: "auto" }}>
          <h3>Tabla de Indicadores Funcionales</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", marginTop: "1rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: "0.75rem" }}>Servicio Clínico</th>
                <th style={{ padding: "0.75rem" }}>Egresos</th>
                <th style={{ padding: "0.75rem" }}>% Egresos</th>
                <th style={{ padding: "0.75rem" }}>Peso GRD Medio</th>
                <th style={{ padding: "0.75rem" }}>% Mortalidad</th>
                <th style={{ padding: "0.75rem" }}>Estada Media (E.M.)</th>
              </tr>
            </thead>
            <tbody>
              {indicadoresServicios.map((fila, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{fila.servicio}</td>
                  <td style={{ padding: "0.75rem" }}>{fila.egresos.toLocaleString()}</td>
                  <td style={{ padding: "0.75rem" }}>{fila.pctEgresos}%</td>
                  <td style={{ padding: "0.75rem" }}>{fila.pesoGrd.toFixed(4)}</td>
                  <td style={{ padding: "0.75rem", color: fila.mortalidad > 5 ? "#ef4444" : "inherit" }}>
                    {fila.mortalidad}%
                  </td>
                  <td style={{ padding: "0.75rem" }}>{fila.estadaMedia} días</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}