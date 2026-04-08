import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RemPage } from "./pages/RemPage";
import { OportunidadHospitalizacionPage } from "./pages/OportunidadHospitalizacionPage";
import { CamasPage } from "./pages/CamasPage";
import { IndicadoresPage } from "./pages/IndicadoresPage";
import { ConfiguracionPage } from "./pages/ConfiguracionPage";
import { IndicadoresServiciosClinicosPage } from "./pages/IndicadoresServiciosClinicosPage";
import { Visor3DPage } from "./pages/Visor3DPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/rem" element={<ProtectedRoute><RemPage /></ProtectedRoute>} />
      <Route path="/rem/oportunidad-hospitalizacion" element={<ProtectedRoute><OportunidadHospitalizacionPage /></ProtectedRoute>} />
      <Route path="/indicadores/servicios" element={<ProtectedRoute><IndicadoresServiciosClinicosPage /></ProtectedRoute>} />
      <Route path="/visor-3d" element={<ProtectedRoute><Visor3DPage /></ProtectedRoute>} />
      <Route path="/indicadores-servicios" element={<ProtectedRoute><IndicadoresServiciosClinicosPage /></ProtectedRoute>} />
      <Route path="/camas" element={<ProtectedRoute><CamasPage /></ProtectedRoute>} />
      <Route path="/indicadores" element={<ProtectedRoute><IndicadoresPage /></ProtectedRoute>} />
      <Route path="/configuracion" element={<ProtectedRoute><ConfiguracionPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
