import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { demoLogin, loginWithCredentials } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const destination = location.state?.from || "/dashboard";

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!user.trim() || !pass.trim()) {
      setError("Debes ingresar usuario y contrasena");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const result = loginWithCredentials(user.trim(), pass.trim());
    setLoading(false);

    if (!result) {
      setError("Credenciales  incorrectas");
      return;
    }

    navigate(destination, { replace: true });
  };

  const handleDemo = (role) => {
    demoLogin(role);
    navigate(destination, { replace: true });
  };

  return (
    <div className="login-wrapper">
      <div className="login-hero">
        <div className="hero-content">
          <h1>Hospital San Jose</h1>
          <p>Plataforma de gestion hospitalaria en tiempo real para monitoreo de camas, indicadores clinicos y optimizacion de procesos asistenciales.</p>
          <div className="hero-stats">
            <div><h3>+450</h3><span>Camas</span></div>
            <div><h3>85%</h3><span>Ocupacion</span></div>
            <div><h3>24/7</h3><span>Monitoreo</span></div>
          </div>
        </div>
      </div>

      <div className="login-container">
        <div className="login-box">
          <h2>Acceso al sistema</h2>
          <p className="subtitle">Ingresa tus credenciales institucionales</p>
          <form onSubmit={submit}>
            <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Usuario" />
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Contrasena" />
            <button id="btn-login" type="submit" disabled={loading}>{loading ? "Ingresando..." : "Ingresar"}</button>
          </form>
          <p id="error" className="error-text">{error}</p>
          <div className="quick-access">
            <span>Modo prueba:</span>
            <button type="button" onClick={() => handleDemo("admin")}>Admin</button>
            <button type="button" onClick={() => handleDemo("medico")}>Doctor</button>
          </div>
          <button className="btn-back" type="button" onClick={() => navigate("/")}>Volver al inicio</button>
        </div>
      </div>
    </div>
  );
}
