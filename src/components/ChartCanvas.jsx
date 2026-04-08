import { useEffect, useMemo, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export function ChartCanvas({ type, data, options, className }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeVersion((current) => current + 1);
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const mergedOptions = useMemo(() => {
    const styles = getComputedStyle(document.body);
    const textColor = styles.getPropertyValue("--chart-text").trim() || styles.getPropertyValue("--text").trim() || "#0f172a";
    const gridColor = styles.getPropertyValue("--chart-grid").trim() || "rgba(148, 163, 184, 0.2)";
    const baseOptions = options || {};

    return {
      ...baseOptions,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
        tooltip: {
          backgroundColor: styles.getPropertyValue("--tooltip-bg").trim() || "#0f172a",
          titleColor: styles.getPropertyValue("--tooltip-text").trim() || "#f8fafc",
          bodyColor: styles.getPropertyValue("--tooltip-text").trim() || "#f8fafc",
          borderColor: styles.getPropertyValue("--tooltip-border").trim() || "rgba(148, 163, 184, 0.22)",
          borderWidth: 1,
        },
        ...baseOptions.plugins,
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
            ...baseOptions.scales?.x?.ticks,
          },
          grid: {
            color: gridColor,
            ...baseOptions.scales?.x?.grid,
          },
          ...baseOptions.scales?.x,
        },
        y: {
          ticks: {
            color: textColor,
            ...baseOptions.scales?.y?.ticks,
          },
          grid: {
            color: gridColor,
            ...baseOptions.scales?.y?.grid,
          },
          ...baseOptions.scales?.y,
        },
        ...baseOptions.scales,
      },
    };
  }, [options, themeVersion]);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, { type, data, options: mergedOptions });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data, mergedOptions, type]);

  return <canvas ref={canvasRef} className={className} />;
}
