import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export function ChartCanvas({ type, data, options, className }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, { type, data, options });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data, options, type]);

  return <canvas ref={canvasRef} className={className} />;
}
