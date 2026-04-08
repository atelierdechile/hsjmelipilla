import { useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { ChartCanvas } from "../components/ChartCanvas";
import {
  INDICADORES_SERVICIOS_META,
  indicadoresServicios,
} from "../lib/indicadoresServiciosDataset";

function percent(value, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function number(value, digits = 0) {
  return Number(value || 0).toLocaleString("es-CL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function compactNumber(value, digits = 1) {
  return Number(value || 0).toLocaleString("es-CL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function IndicadoresServiciosClinicosPage() {
  const [selectedService, setSelectedService] = useState("");

  const sortedByEgresos = useMemo(
    () => [...indicadoresServicios].sort((left, right) => right.egresos - left.egresos),
    [],
  );

  const selected = useMemo(
    () =>
      indicadoresServicios.find((item) => item.code === selectedService) ?? sortedByEgresos[0],
    [selectedService, sortedByEgresos],
  );

  const summary = useMemo(() => {
    const totalEgresos = indicadoresServicios.reduce((acc, item) => acc + item.egresos, 0);
    const weighted = (key) =>
      indicadoresServicios.reduce((acc, item) => acc + item[key] * item.egresos, 0) / totalEgresos;

    const highestMortality = [...indicadoresServicios].sort(
      (left, right) => right.mortalidadPct - left.mortalidadPct,
    )[0];
    const highestComplexity = [...indicadoresServicios].sort(
      (left, right) => right.pesoGrd - left.pesoGrd,
    )[0];
    const largestStayGap = [...indicadoresServicios]
      .map((item) => ({ ...item, gap: item.estadaMedia - item.emNorma }))
      .sort((left, right) => right.gap - left.gap)[0];

    return {
      totalEgresos,
      weightedMortality: weighted("mortalidadPct"),
      weightedStay: weighted("estadaMedia"),
      weightedComplexity: weighted("pesoGrd"),
      weightedOutliers: weighted("outliersPct"),
      highestMortality,
      highestComplexity,
      largestStayGap,
    };
  }, []);

  const egresosChartData = useMemo(
    () => ({
      labels: sortedByEgresos.map((item) => item.servicio),
      datasets: [
        {
          label: "Egresos",
          data: sortedByEgresos.map((item) => item.egresos),
          backgroundColor: [
            "#2563eb",
            "#3b82f6",
            "#60a5fa",
            "#0ea5e9",
            "#38bdf8",
            "#06b6d4",
            "#14b8a6",
            "#22c55e",
            "#94a3b8",
          ],
          borderRadius: 10,
          borderSkipped: false,
        },
      ],
    }),
    [sortedByEgresos],
  );

  const estadaChartData = useMemo(
    () => ({
      labels: indicadoresServicios.map((item) => item.servicio),
      datasets: [
        {
          label: "Estada media",
          data: indicadoresServicios.map((item) => item.estadaMedia),
          backgroundColor: "#2563eb",
          borderRadius: 8,
        },
        {
          label: "EM norma",
          data: indicadoresServicios.map((item) => item.emNorma),
          backgroundColor: "#f97316",
          borderRadius: 8,
        },
      ],
    }),
    [],
  );

  const mortalityChartData = useMemo(
    () => ({
      labels: indicadoresServicios.map((item) => item.servicio),
      datasets: [
        {
          label: "Mortalidad",
          data: indicadoresServicios.map((item) => Number((item.mortalidadPct * 100).toFixed(2))),
          borderColor: "#dc2626",
          backgroundColor: "rgba(220, 38, 38, 0.16)",
          pointBackgroundColor: "#dc2626",
          pointRadius: 4,
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [],
  );

  const inlierBenchmarkChartData = useMemo(
    () => ({
      labels: indicadoresServicios.map((item) => item.servicio),
      datasets: [
        {
          label: "IF Inlier",
          data: indicadoresServicios.map((item) => Number(item.ifInlier.toFixed(2))),
          backgroundColor: "#dbeafe",
          borderColor: "#dbeafe",
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: "y",
        },
        {
          label: "IEMA Inlier",
          data: indicadoresServicios.map((item) => Number(item.iemaInlier.toFixed(2))),
          backgroundColor: "#60a5fa",
          borderColor: "#60a5fa",
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: "y",
        },
        {
          label: "IC Inlier",
          data: indicadoresServicios.map((item) => Number(item.icInlier.toFixed(2))),
          backgroundColor: "#1664b5",
          borderColor: "#1664b5",
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: "y",
        },
        {
          type: "line",
          label: "Peso GRD Medio Inlier",
          data: indicadoresServicios.map((item) => Number(item.pesoGrd.toFixed(4))),
          yAxisID: "y1",
          borderColor: "#22c55e",
          backgroundColor: "#22c55e",
          pointBackgroundColor: "#22c55e",
          pointBorderColor: "#22c55e",
          pointRadius: 4,
          pointHoverRadius: 5,
          showLine: false,
        },
        {
          type: "line",
          label: "1.05",
          data: indicadoresServicios.map(() => 1.05),
          yAxisID: "y",
          borderColor: "#ef4444",
          backgroundColor: "#ef4444",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
        },
        {
          type: "line",
          label: "0.95",
          data: indicadoresServicios.map(() => 0.95),
          yAxisID: "y",
          borderColor: "#f59e0b",
          backgroundColor: "#f59e0b",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
        },
      ],
    }),
    [],
  );

  const selectedServiceMetrics = useMemo(
    () => [
      { label: "Egresos", value: number(selected.egresos), tone: "neutral" },
      { label: "% Egresos", value: percent(selected.pctEgresos, 2), tone: "neutral" },
      { label: "Peso GRD Medio Inlier", value: compactNumber(selected.pesoGrd, 4), tone: "neutral" },
      { label: "% Inliers", value: percent(selected.inliersPct, 2), tone: "good" },
      { label: "% Outliers Superiores", value: percent(selected.outliersPct, 2), tone: selected.outliersPct > 0.04 ? "warning" : "neutral" },
      { label: "% Mortalidad", value: percent(selected.mortalidadPct, 2), tone: selected.mortalidadPct > 0.08 ? "danger" : "neutral" },
      { label: "E.M.", value: compactNumber(selected.estadaMedia, 1), tone: "neutral" },
      { label: "EM Norma (Depurada)", value: compactNumber(selected.emNorma, 1), tone: "neutral" },
      { label: "E.M. Inliers", value: compactNumber(selected.estadaInliers, 1), tone: "neutral" },
      { label: "EMAF Inlier", value: compactNumber(selected.emafInlier, 1), tone: "neutral" },
      { label: "EMAC Inlier", value: compactNumber(selected.emacInlier, 1), tone: "neutral" },
      { label: "IEMA Inlier", value: compactNumber(selected.iemaInlier, 2), tone: "neutral" },
      { label: "IF Inlier", value: compactNumber(selected.ifInlier, 2), tone: "neutral" },
      { label: "IC Inlier", value: compactNumber(selected.icInlier, 2), tone: "neutral" },
      { label: "Estancias evitables", value: number(selected.estanciasEvitables, 1), tone: selected.estanciasEvitables < 0 ? "danger" : "neutral" },
      { label: "E.M. Outliers Superiores", value: compactNumber(selected.estadaOutliers, 1), tone: "neutral" },
    ],
    [selected],
  );

  return (
    <AppShell
      title="Indicadores Servicios Clínicos"
      status={`Fuente ejecutada ${INDICADORES_SERVICIOS_META.executionTime}`}
      actions={
        <div className="filters">
          <select value={INDICADORES_SERVICIOS_META.year} disabled>
            <option>{INDICADORES_SERVICIOS_META.year}</option>
          </select>
          <select value={INDICADORES_SERVICIOS_META.periodLabel} disabled>
            <option>{INDICADORES_SERVICIOS_META.periodLabel}</option>
          </select>
          <select value={INDICADORES_SERVICIOS_META.hospital} disabled>
            <option>{INDICADORES_SERVICIOS_META.hospital}</option>
          </select>
        </div>
      }
    >
      <section className="service-overview-grid">
        <article className="card service-hero-card">
          <div className="service-hero-copy">
            <span className="opportunity-chip">Indicadores funcionales</span>
            <h2>Resumen clínico por servicio 2025</h2>
            <p>
              Vista consolidada de egresos, complejidad, mortalidad y estadía media para
              priorizar servicios con mayor presión asistencial y desviación frente a la norma.
            </p>
          </div>

          <div className="service-hero-metrics">
            <div>
              <span>Egresos totales</span>
              <strong>{number(summary.totalEgresos)}</strong>
            </div>
            <div>
              <span>Mortalidad ponderada</span>
              <strong>{percent(summary.weightedMortality)}</strong>
            </div>
            <div>
              <span>Estadía media ponderada</span>
              <strong>{number(summary.weightedStay, 1)} días</strong>
            </div>
          </div>
        </article>

        <article className="card opportunity-card opportunity-card-title">
          <span className="opportunity-card-label">Periodo analizado</span>
          <h3>{INDICADORES_SERVICIOS_META.periodLabel} {INDICADORES_SERVICIOS_META.year}</h3>
          <p>Comparación referencial contra {INDICADORES_SERVICIOS_META.comparisonPeriod}.</p>
        </article>

        <article className="card opportunity-card">
          <span className="opportunity-card-label">Complejidad promedio</span>
          <h3>{number(summary.weightedComplexity, 2)}</h3>
          <p>Peso GRD medio ponderado para el conjunto de servicios clínicos.</p>
        </article>

        <article className="card opportunity-card">
          <span className="opportunity-card-label">Outliers superiores</span>
          <h3>{percent(summary.weightedOutliers)}</h3>
          <p>Proporción ponderada de casos con estancias superiores al comportamiento esperado.</p>
        </article>

        <article className="card opportunity-card">
          <span className="opportunity-card-label">Benchmark usado</span>
          <h3>MINSAL IRv3.0</h3>
          <p>{INDICADORES_SERVICIOS_META.benchmark}</p>
        </article>
      </section>

      <section className="opportunity-highlights-grid service-highlight-grid">
        <article className="card opportunity-highlight-card">
          <span className="opportunity-card-label">Mayor volumen</span>
          <h3>{sortedByEgresos[0].servicio}</h3>
          <strong className="highlight-value neutral">{number(sortedByEgresos[0].egresos)}</strong>
          <p>{percent(sortedByEgresos[0].pctEgresos, 2)} del total de egresos del periodo.</p>
        </article>

        <article className="card opportunity-highlight-card">
          <span className="opportunity-card-label">Mayor mortalidad</span>
          <h3>{summary.highestMortality.servicio}</h3>
          <strong className="highlight-value negative">
            {percent(summary.highestMortality.mortalidadPct, 2)}
          </strong>
          <p>Servicio que requiere monitoreo clínico reforzado por riesgo de desenlace.</p>
        </article>

        <article className="card opportunity-highlight-card">
          <span className="opportunity-card-label">Mayor brecha EM</span>
          <h3>{summary.largestStayGap.servicio}</h3>
          <strong className="highlight-value negative">
            +{number(summary.largestStayGap.gap, 1)} días
          </strong>
          <p>Diferencia entre estadía observada y norma depurada del benchmark.</p>
        </article>
      </section>

      <section className="service-comparison-section">
        <article className="card opportunity-history-card">
          <div className="card-header">
            <div>
              <h3>Comparativo Inlier y peso GRD</h3>
              <p className="service-chart-caption">
                Relaciona IF, IEMA e IC Inlier con el peso GRD medio de cada servicio y dos
                umbrales de referencia operativa.
              </p>
            </div>
          </div>
          <div className="chart-container service-comparison-chart">
            <ChartCanvas
              type="bar"
              data={inlierBenchmarkChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: "index",
                  intersect: false,
                },
                plugins: {
                  legend: {
                    position: "right",
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      autoSkip: false,
                      maxRotation: 90,
                      minRotation: 90,
                      font: {
                        size: 11,
                      },
                    },
                  },
                  y: {
                    min: 0,
                    max: 1.8,
                    ticks: {
                      callback: (value) => number(value, 4),
                    },
                    title: {
                      display: true,
                      text: "IF Inlier, IEMA Inlier, IC Inlier",
                    },
                  },
                  y1: {
                    position: "right",
                    min: 0,
                    max: 4.2,
                    grid: {
                      drawOnChartArea: false,
                    },
                    ticks: {
                      callback: (value) => number(value, 4),
                    },
                    title: {
                      display: true,
                      text: "Peso GRD Medio Inlier",
                    },
                  },
                },
              }}
            />
          </div>
        </article>
      </section>

      <section className="grid-2 opportunity-content-grid">
        <article className="card opportunity-table-card">
          <div className="card-header">
            <h3>Detalle por servicio clínico</h3>
            <div className="service-select-wrap">
              <select value={selected.code} onChange={(event) => setSelectedService(event.target.value)}>
                {sortedByEgresos.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.servicio}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="opportunity-table-wrap">
            <table className="opportunity-table service-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Egresos</th>
                  <th>% Egresos</th>
                  <th>Peso GRD</th>
                  <th>% Inliers</th>
                  <th>% Outliers</th>
                  <th>% Mortalidad</th>
                  <th>Estadía media</th>
                  <th>EM Norma</th>
                </tr>
              </thead>
              <tbody>
                {sortedByEgresos.map((item) => {
                  const isSelected = item.code === selected.code;
                  const stayGap = item.estadaMedia - item.emNorma;

                  return (
                    <tr key={item.code} className={isSelected ? "service-row-selected" : ""}>
                      <td>
                        <div className="service-name-cell">
                          <strong>{item.servicio}</strong>
                          <span>{item.code}</span>
                        </div>
                      </td>
                      <td>{number(item.egresos)}</td>
                      <td>{percent(item.pctEgresos, 2)}</td>
                      <td>{number(item.pesoGrd, 2)}</td>
                      <td>{percent(item.inliersPct, 2)}</td>
                      <td>{percent(item.outliersPct, 2)}</td>
                      <td className={item.mortalidadPct > 0.08 ? "difference-bad" : ""}>
                        {percent(item.mortalidadPct, 2)}
                      </td>
                      <td className={stayGap > 0 ? "difference-bad" : "difference-good"}>
                        {number(item.estadaMedia, 1)}
                      </td>
                      <td>{number(item.emNorma, 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="opportunity-side-panel">
          <article className="card opportunity-formula-card service-focus-card">
            <span className="opportunity-card-label">Servicio focal</span>
            <h3>{selected.servicio}</h3>
            <div className="service-focus-scroll">
              <div className="service-focus-metrics service-focus-metrics-expanded">
              {selectedServiceMetrics.map((metric) => (
                <div key={metric.label} className={`service-focus-metric service-focus-metric-${metric.tone}`}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
              </div>
            </div>
          </article>

          <article className="card opportunity-history-card">
            <h3>Egresos por servicio</h3>
            <div className="chart-container service-chart-tall">
              <ChartCanvas
                type="bar"
                data={egresosChartData}
                options={{
                  indexAxis: "y",
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: {
                      ticks: {
                        callback: (value) => number(value),
                      },
                    },
                  },
                }}
              />
            </div>
          </article>
        </aside>
      </section>

      <section className="grid-2 opportunity-content-grid">
        <article className="card opportunity-history-card">
          <h3>Estadía media vs norma</h3>
          <div className="chart-container">
            <ChartCanvas
              type="bar"
              data={estadaChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom" },
                },
              }}
            />
          </div>
        </article>

        <article className="card opportunity-insight-card">
          <h3>Mortalidad y lectura operativa</h3>
          <div className="chart-container service-chart-medium">
            <ChartCanvas
              type="line"
              data={mortalityChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => `${value}%`,
                    },
                  },
                },
              }}
            />
          </div>

          <ul className="opportunity-insight-list">
            <li>
              El servicio con mayor peso de egresos es <strong>{sortedByEgresos[0].servicio}</strong>, con{" "}
              <strong>{percent(sortedByEgresos[0].pctEgresos, 2)}</strong> del total.
            </li>
            <li>
              La mayor complejidad promedio se concentra en{" "}
              <strong>{summary.highestComplexity.servicio}</strong> con un peso GRD de{" "}
              <strong>{number(summary.highestComplexity.pesoGrd, 2)}</strong>.
            </li>
            <li>
              La mayor desviación de estadía está en <strong>{summary.largestStayGap.servicio}</strong>, con{" "}
              <strong>+{number(summary.largestStayGap.gap, 1)} días</strong> sobre la norma.
            </li>
          </ul>
        </article>
      </section>
    </AppShell>
  );
}
