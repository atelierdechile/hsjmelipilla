import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../lib/auth";

const items = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/rem", label: "REM" },
  { to: "/rem/oportunidad-hospitalizacion", label: "Oportunidad Hospitalizacion" },
  { to: "/camas", label: "Camas" },
  { to: "/indicadores", label: "Indicadores" },
  { to: "/configuracion", label: "Configuracion" },
];

export function AppShell({ title, status = "En tiempo real", children, actions }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  const handleLogout = () => {
    clearSession();
    setMenuOpen(false);
    navigate("/login", { replace: true });
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
          {session.user ? `Usuario: ${session.user} (${session.role})` : "Sesion activa"}
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="topbar-heading">
            <h1>{title}</h1>
            {status ? <span className="status">{status}</span> : null}
          </div>
          {actions ? <div className="topbar-actions">{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
