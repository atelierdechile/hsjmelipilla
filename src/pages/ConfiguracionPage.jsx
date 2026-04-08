import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { applyTheme, readConfig, writeConfig } from "../lib/theme";

export function ConfiguracionPage() {
  const [config, setConfig] = useState({ darkMode: false, notifications: false, animations: true });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const current = readConfig();
    setConfig({
      darkMode: Boolean(current.darkMode),
      notifications: Boolean(current.notifications),
      animations: current.animations !== false,
    });
    setHydrated(true);

    const handleConfigChange = (event) => {
      const next = event.detail || {};
      setConfig((current) => {
        const normalized = {
          darkMode: Boolean(next.darkMode),
          notifications: Boolean(next.notifications),
          animations: next.animations !== false,
        };

        if (
          current.darkMode === normalized.darkMode &&
          current.notifications === normalized.notifications &&
          current.animations === normalized.animations
        ) {
          return current;
        }

        return normalized;
      });
    };

    window.addEventListener("configchange", handleConfigChange);
    return () => window.removeEventListener("configchange", handleConfigChange);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeConfig(config);
    applyTheme(Boolean(config.darkMode));
  }, [config, hydrated]);

  return (
    <AppShell title="Configuración del sistema" status="">
      <section className="card">
        <h3>Preferencias</h3>
        <div className="setting"><label><input type="checkbox" checked={config.darkMode} onChange={(e) => setConfig({ ...config, darkMode: e.target.checked })} />Modo oscuro</label></div>
        <div className="setting"><label><input type="checkbox" checked={config.notifications} onChange={(e) => setConfig({ ...config, notifications: e.target.checked })} />Notificaciones activas</label></div>
        <div className="setting"><label><input type="checkbox" checked={config.animations} onChange={(e) => setConfig({ ...config, animations: e.target.checked })} />Animaciones UI</label></div>
      </section>
    </AppShell>
  );
}
