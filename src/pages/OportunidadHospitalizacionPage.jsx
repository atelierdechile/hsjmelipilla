import { useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { ChartCanvas } from "../components/ChartCanvas";
import { MONTH_OPTIONS, monthLabel } from "../lib/data";
import {
  HOSPITALIZATION_DATA,
  HOSPITALIZATION_INDICATOR,
  HOSPITALIZATION_TARGET,
} from "../lib/oportunidadHospitalizacionData";

const CHART_COLORS = {
  "2023": "#2563eb",
  "2024": "#10b981",
  "2025": "#ef4444",
};

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function calculateCompliance(p1, p2) {
  return p2 ? roundOne((p1 / p2) * 100) : 0;
}

export function OportunidadHospitalizacionPage() {
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("");
  const [establishment, setEstablishment] = useState(HOSPITALIZATION_INDICATOR.establishment);

  const years = [...new Set(HOSPITALIZATION_DATA.map((item) => item.year))];

  const tableRows = useMemo(() => {
    return HOSPITALIZATION_DATA.filter((item) => (!year || item.year === year) && (!month || item.month === month))
      .map((item) => {
        const compliance = calculateCompliance(item.p1, item.p2);
        return {
          ...item,
          compliance,
          difference: roundOne(HOSPITALIZATION_TARGET - compliance),
        };
      })
      .sort((left, right) => {
        if (left.year !== right.year) return Number(left.year) - Number(right.year);
        return Number(left.month) - Number(right.month);
      });
  }, [month, year]);

  const summary = useMemo(() => {
    const totalP1 = tableRows.reduce((acc, item) => acc + item.p1, 0);
    const totalP2 = tableRows.reduce((acc, item) => acc + item.p2, 0);
    const compliance = calculateCompliance(totalP1, totalP2);
    return {
      totalP1,
      totalP2,
      compliance,
      difference: roundOne(HOSPITALIZATION_TARGET - compliance),
    };
  }, [tableRows]);

  const yearlyPerformance = useMemo(() => {
    return years.map((itemYear) => {
      const rows = HOSPITALIZATION_DATA.filter((item) => item.year === itemYear);
      const totalP1 = rows.reduce((acc, item) => acc + item.p1, 0);
      const totalP2 = rows.reduce((acc, item) => acc + item.p2, 0);
      const compliance = calculateCompliance(totalP1, totalP2);
      return {
        year: itemYear,
        totalP1,
        totalP2,
        compliance,
        difference: roundOne(HOSPITALIZATION_TARGET - compliance),
      };
    });
  }, [years]);

  const monthlyHighlights = useMemo(() => {
    const scopedRows = year
      ? HOSPITALIZATION_DATA.filter((item) => item.year === year)
      : tableRows;

    if (!scopedRows.length) {
      return { best: null, worst: null, average: 0 };
    }

    const enriched = scopedRows.map((item) => ({
      ...item,
      compliance: calculateCompliance(item.p1, item.p2),
    }));

    const sorted = [...enriched].sort((left, right) => right.compliance - left.compliance);
    const average =
      enriched.reduce((acc, item) => acc + item.compliance, 0) / enriched.length;

    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      average: roundOne(average),
    };
  }, [tableRows, year]);

  const currentYearFocus = year || "Historico";
  const statusTone =
    summary.compliance >= HOSPITALIZATION_TARGET + 3
      ? "excellent"
      : summary.compliance >= HOSPITALIZATION_TARGET
        ? "good"
        : "attention";

  const chartData = useMemo(() => {
    return {
      labels: MONTH_OPTIONS.map((item) => item.label.slice(0, 3)),
      datasets: years.map((itemYear) => ({
        label: itemYear,
        data: MONTH_OPTIONS.map((itemMonth) => {
          const match = HOSPITALIZATION_DATA.find(
            (entry) => entry.year === itemYear && entry.month === itemMonth.value,
          );
          return match ? calculateCompliance(match.p1, match.p2) : null;
        }),
        borderColor: CHART_COLORS[itemYear] || "#64748b",
        backgroundColor: CHART_COLORS[itemYear] || "#64748b",
        tension: 0.35,
        fill: false,
        borderWidth: year === itemYear || !year ? 3 : 2,
        pointRadius: year === itemYear || !year ? 4 : 3,
      })),
    };
  }, [year, years]);

  return (
    <AppShell
      title="Oportunidad de Hospitalizacion"
      actions={
        <div className="filters">
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            <option value="">Todos los años</option>
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={month} onChange={(event) => setMonth(event.target.value)}>
            <option value="">Todos los meses</option>
            {MONTH_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select value={establishment} onChange={(event) => setEstablishment(event.target.value)}>
            <option value={HOSPITALIZATION_INDICATOR.establishment}>
              {HOSPITALIZATION_INDICATOR.establishment}
            </option>
          </select>
        </div>
      }
    >
      <section className="hospital-opportunity-grid">
        <article className={`card opportunity-hero-card opportunity-tone-${statusTone}`}>
          <div className="opportunity-hero-copy">
            <span className="opportunity-chip">Monitoreo continuo</span>
            <h2>{currentYearFocus === "Historico" ? "Vista historica consolidada" : `Seguimiento ${currentYearFocus}`}</h2>
            <p>
              Indicador operativo para controlar la velocidad de acceso a cama de hospitalización desde urgencia y detectar períodos con mayor presión asistencial.
            </p>
          </div>
          <div className="opportunity-hero-metrics">
            <div>
              <span>Cumplimiento actual</span>
              <strong>{summary.compliance.toFixed(1)}%</strong>
            </div>
            <div>
              <span>Brecha vs meta</span>
              <strong>{summary.difference.toFixed(1)}%</strong>
            </div>
            <div>
              <span>Meta institucional</span>
              <strong>{HOSPITALIZATION_TARGET}%</strong>
            </div>
          </div>
        </article>

        <article className="card opportunity-card opportunity-card-title">
          <span className="opportunity-card-label">Nombre indicador</span>
          <h3>{HOSPITALIZATION_INDICATOR.name}</h3>
        </article>

        <article className="card opportunity-card">
          <span className="opportunity-card-label">Meta</span>
          <h3>{HOSPITALIZATION_INDICATOR.meta}</h3>
          <p>Se muestra el valor cargado y la diferencia respecto a la meta.</p>
        </article>

        <article className="card opportunity-card">
          <span className="opportunity-card-label">Numerador (P1)</span>
          <h3>{summary.totalP1.toLocaleString("es-CL")}</h3>
          <p>{HOSPITALIZATION_INDICATOR.numerator}</p>
        </article>

        <article className="card opportunity-card">
          <span className="opportunity-card-label">Denominador (P2)</span>
          <h3>{summary.totalP2.toLocaleString("es-CL")}</h3>
          <p>{HOSPITALIZATION_INDICATOR.denominator}</p>
        </article>
      </section>

      <section className="opportunity-highlights-grid">
        <article className="card opportunity-highlight-card">
          <span className="opportunity-card-label">Mejor mes</span>
          <h3>
            {monthlyHighlights.best
              ? `${monthLabel(monthlyHighlights.best.month)} ${monthlyHighlights.best.year}`
              : "--"}
          </h3>
          <strong className="highlight-value positive">
            {monthlyHighlights.best ? `${monthlyHighlights.best.compliance.toFixed(1)}%` : "--"}
          </strong>
          <p>Período con mejor acceso a cama dentro del rango analizado.</p>
        </article>

        <article className="card opportunity-highlight-card">
          <span className="opportunity-card-label">Mes mas exigido</span>
          <h3>
            {monthlyHighlights.worst
              ? `${monthLabel(monthlyHighlights.worst.month)} ${monthlyHighlights.worst.year}`
              : "--"}
          </h3>
          <strong className="highlight-value negative">
            {monthlyHighlights.worst ? `${monthlyHighlights.worst.compliance.toFixed(1)}%` : "--"}
          </strong>
          <p>Período donde la oportunidad quedó más lejos del objetivo definido.</p>
        </article>

        <article className="card opportunity-highlight-card">
          <span className="opportunity-card-label">Promedio periodo</span>
          <h3>{currentYearFocus}</h3>
          <strong className="highlight-value neutral">{monthlyHighlights.average.toFixed(1)}%</strong>
          <p>Referencia rápida para interpretar el comportamiento mensual del indicador.</p>
        </article>
      </section>

      <section className="opportunity-year-strip">
        {yearlyPerformance.map((item) => (
          <article
            key={item.year}
            className={`card opportunity-year-card ${year === item.year ? "active" : ""}`}
          >
            <div className="opportunity-year-card-head">
              <h3>{item.year}</h3>
              <span>{item.totalP2.toLocaleString("es-CL")} ingresos evaluados</span>
            </div>
            <strong>{item.compliance.toFixed(1)}%</strong>
            <div className="opportunity-progress">
              <div
                className="opportunity-progress-bar"
                style={{ width: `${Math.min(item.compliance, 100)}%` }}
              />
            </div>
            <p>{item.difference.toFixed(1)}% de diferencia respecto de la meta.</p>
          </article>
        ))}
      </section>

      <section className="grid-2 opportunity-content-grid">
        <article className="card opportunity-table-card">
          <div className="card-header">
            <h3>Detalle mensual</h3>
            <div className="opportunity-summary-inline">
              <span>{summary.compliance.toFixed(1)}% cumplimiento</span>
              <strong>{summary.difference.toFixed(1)}% diferencia meta</strong>
            </div>
          </div>

          <div className="opportunity-table-wrap">
            <table className="opportunity-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Ano</th>
                  <th>P1</th>
                  <th>P2</th>
                  <th>% Cumplimiento</th>
                  <th>Meta</th>
                  <th>Diferencia Meta</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((item) => (
                  <tr key={`${item.year}-${item.month}`}>
                    <td>{monthLabel(item.month).toLowerCase()}</td>
                    <td>{item.year}</td>
                    <td>{item.p1}</td>
                    <td>{item.p2}</td>
                    <td>{item.compliance.toFixed(1)}%</td>
                    <td>{HOSPITALIZATION_TARGET}%</td>
                    <td className={item.difference > 0 ? "difference-bad" : "difference-good"}>
                      {item.difference.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="opportunity-side-panel">
          <article className="card opportunity-formula-card">
            <h3>Formula</h3>
            <p>{HOSPITALIZATION_INDICATOR.formula}</p>
          </article>

          <article className="card opportunity-history-card">
            <h3>Historico por año</h3>
            <div className="chart-container">
              <ChartCanvas
                type="line"
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.raw?.toFixed(1)}%`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      suggestedMin: 60,
                      suggestedMax: 100,
                      ticks: {
                        callback: (value) => `${value}%`,
                      },
                    },
                  },
                }}
              />
            </div>
          </article>

          <article className="card opportunity-insight-card">
            <h3>Lectura operativa</h3>
            <ul className="opportunity-insight-list">
              <li>
                El numerador acumulado alcanza <strong>{summary.totalP1.toLocaleString("es-CL")}</strong>{" "}
                pacientes oportunamente hospitalizados.
              </li>
              <li>
                El denominador acumulado es <strong>{summary.totalP2.toLocaleString("es-CL")}</strong>, lo que
                deja el cumplimiento en <strong>{summary.compliance.toFixed(1)}%</strong>.
              </li>
              <li>
                {summary.compliance >= HOSPITALIZATION_TARGET
                  ? "El indicador supera la meta definida y conviene sostener el comportamiento de los meses fuertes."
                  : "El indicador queda bajo la meta y conviene priorizar los meses más bajos para intervenciones."}
              </li>
            </ul>
          </article>
        </aside>
      </section>
    </AppShell>
  );
}
