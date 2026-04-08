import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../lib/auth";
import { isDarkModeEnabled, readConfig, setDarkMode } from "../lib/theme";

const items = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/rem", label: "REM" },
  { to: "/rem/oportunidad-hospitalizacion", label: "Oportunidad de Hospitalización" },
  { to: "/indicadores/servicios", label: "Indicadores Servicios Clínicos" },
  { to: "/camas", label: "Camas" },
  { to: "/indicadores", label: "Indicadores" },
  { to: "/configuracion", label: "Configuración" },
];

export function AppShell({ title, status = "En tiempo real", children, actions }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkModeState] = useState(isDarkModeEnabled);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  useEffect(() => {
    const syncTheme = () => setDarkModeState(Boolean(readConfig().darkMode));
    window.addEventListener("themechange", syncTheme);
    window.addEventListener("configchange", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("themechange", syncTheme);
      window.removeEventListener("configchange", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    setMenuOpen(false);
    navigate("/login", { replace: true });
  };

  const handleThemeToggle = () => {
    const nextValue = !darkMode;
    setDarkMode(nextValue);
    setDarkModeState(nextValue);
  };

  return (
    <div className="layout app-shell">
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={menuOpen ? "sidebar-overlay active" : "sidebar-overlay"}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside className={menuOpen ? "sidebar active" : "sidebar"}>
        <div className="sidebar-top">
          <div className="logo">Hospital SJ</div>
          <ul className="menu" id="menu">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => (isActive ? "menu-link active" : "menu-link")}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="logout">
              <button type="button" className="menu-link logout-button" onClick={handleLogout}>
                Salir
              </button>
            </li>
          </ul>
        </div>
        <div className="user-box" id="usuario">
          {session.user ? `Usuario: ${session.user} (${session.role})` : "Sesión activa"}
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="topbar-heading">
            <h1>{title}</h1>
            {status ? <span className="status">{status}</span> : null}
          </div>
          <div className="topbar-tools">
            {actions ? <div className="topbar-actions">{actions}</div> : null}
            <button
              type="button"
              className={darkMode ? "theme-toggle dark" : "theme-toggle"}
              onClick={handleThemeToggle}
              aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb">
                  <span className="theme-icon theme-icon-sun" aria-hidden="true">☀</span>
                  <span className="theme-icon theme-icon-moon" aria-hidden="true">☾</span>
                </span>
              </span>
              <span className="theme-toggle-label">
                {darkMode ? "Modo oscuro" : "Modo claro"}
              </span>
            </button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
