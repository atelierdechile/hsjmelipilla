import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const features = [
  { title: "Visualizacion en tiempo real", description: "Indicadores clinicos criticos disponibles de forma inmediata para decisiones oportunas." },
  { title: "Gestion de camas", description: "Control completo de ocupacion hospitalaria, disponibilidad y rotacion." },
  { title: "Eficiencia operativa", description: "Reduccion de tiempos de espera y mejora continua de procesos asistenciales." },
];

export function LandingPage() {
  const [visible, setVisible] = useState(false);
  const stats = useMemo(() => [
    { value: "+450", label: "Camas" },
    { value: "85%", label: "Ocupacion" },
    { value: "24/7", label: "Monitoreo" },
  ], []);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className="landing-page">
      <section className="hero">
        <div className="overlay">
          <div className="container">
            <div className="landing-content">
              <h1>Gestion hospitalaria en tiempo real</h1>
              <p>Plataforma clinica para monitoreo de camas, indicadores y optimizacion de procesos asistenciales en el Hospital San Jose de Melipilla.</p>
              <div className="buttons">
                <Link to="/login" className="btn primary">Acceder al sistema</Link>
              </div>
              <div className="hero-stats">
                {stats.map((item) => <div key={item.label}><h3>{item.value}</h3><span>{item.label}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container features-grid">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)" }}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <h2>Acceso seguro para personal autorizado</h2>
          <p>Plataforma interna con monitoreo continuo y soporte en tiempo real.</p>
        </div>
      </section>

      <footer className="footer"><div className="container"><p>© 2026 Hospital San Jose de Melipilla</p></div></footer>
    </div>
  );
}
