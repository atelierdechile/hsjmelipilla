import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";

const STORAGE_KEY = "config";

export function ConfiguracionPage() {
  const [config, setConfig] = useState({ darkMode: false, notifications: false, animations: true });

  useEffect(() => {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (current) {
      setConfig({ darkMode: Boolean(current.darkMode), notifications: Boolean(current.notifications), animations: current.animations !== false });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    document.body.classList.toggle("dark", config.darkMode);
  }, [config]);

  return (
    <AppShell title="Configuracion del sistema" status="">
      <section className="card">
        <h3>Preferencias</h3>
        <div className="setting"><label><input type="checkbox" checked={config.darkMode} onChange={(e) => setConfig({ ...config, darkMode: e.target.checked })} />Modo oscuro</label></div>
        <div className="setting"><label><input type="checkbox" checked={config.notifications} onChange={(e) => setConfig({ ...config, notifications: e.target.checked })} />Notificaciones activas</label></div>
        <div className="setting"><label><input type="checkbox" checked={config.animations} onChange={(e) => setConfig({ ...config, animations: e.target.checked })} />Animaciones UI</label></div>
      </section>
    </AppShell>
  );
}
