import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "../css/global.css";
import "../css/landing.css";
import "../css/login.css";
import "../css/dashboard.css";
import "../css/rem.css";
import "../css/camas.css";
import "../css/indicadores.css";
import "../css/configuracion.css";
import "./styles.css";
import { initializeTheme } from "./lib/theme";

initializeTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
