import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import RoleRoute from './components/RoleRoute';
import { FIRMA_ROLES, CORREO_ROLES, HR_ROLES, RECLUTAMIENTO_ROLES, BEEMO_ROLES, ALL_ROLES, defaultRouteForRole } from './utils/roles';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SendDocument from './pages/SendDocument';
import SignatureList from './pages/SignatureList';
import SignatureDetail from './pages/SignatureDetail';
import SignPage from './pages/SignPage';
import SendCarta from './pages/SendCarta';
import CartaList from './pages/CartaList';
import CartaDetail from './pages/CartaDetail';
import FormularioPublico from './pages/FormularioPublico';
import ActualizarDatosPublico from './pages/ActualizarDatosPublico';
import PublicDataUpdateList from './pages/PublicDataUpdateList';
import OleadaList from './pages/OleadaList';
import OleadaCreate from './pages/OleadaCreate';
import OleadaDetail from './pages/OleadaDetail';
import AgentList from './pages/AgentList';
import SendContract from './pages/SendContract';
import ContractList from './pages/ContractList';
import ContractDetail from './pages/ContractDetail';
import HrSignPage from './pages/HrSignPage';
import CandidatoList from './pages/CandidatoList';
import CandidatoDetail from './pages/CandidatoDetail';
import FirmarCV from './pages/FirmarCV';
import SendBeemo from './pages/SendBeemo';
import BeemoList from './pages/BeemoList';
import BeemoDetail from './pages/BeemoDetail';
import BeemoSignPage from './pages/BeemoSignPage';
import PoliticaPrivacidad from './pages/PoliticaPrivacidad';
import NotFound from './pages/NotFound';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={defaultRouteForRole(user.role)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/firmar/:token" element={<SignPage />} />
          <Route path="/formulario/:token" element={<FormularioPublico />} />
          <Route path="/actualizar-datos" element={<ActualizarDatosPublico />} />
          <Route path="/actualizar-datos/:npnSlug" element={<ActualizarDatosPublico />} />
          <Route path="/firmar-contrato/:token" element={<HrSignPage />} />
          <Route path="/firmar-reclutamiento/:token" element={<FirmarCV />} />
          <Route path="/firmar-beemo/:token" element={<BeemoSignPage />} />
          <Route path="/politica-de-privacidad" element={<PoliticaPrivacidad />} />
          <Route path="/dashboard" element={<RoleRoute roles={ALL_ROLES}><Dashboard /></RoleRoute>} />
          <Route path="/enviar" element={<RoleRoute roles={FIRMA_ROLES}><SendDocument /></RoleRoute>} />
          <Route path="/firmas" element={<RoleRoute roles={FIRMA_ROLES}><SignatureList /></RoleRoute>} />
          <Route path="/firmas/:id" element={<RoleRoute roles={FIRMA_ROLES}><SignatureDetail /></RoleRoute>} />
          <Route path="/enviar-carta" element={<RoleRoute roles={CORREO_ROLES}><SendCarta /></RoleRoute>} />
          <Route path="/cartas" element={<RoleRoute roles={CORREO_ROLES}><CartaList /></RoleRoute>} />
          <Route path="/cartas/:id" element={<RoleRoute roles={CORREO_ROLES}><CartaDetail /></RoleRoute>} />
          <Route path="/oleadas" element={<RoleRoute roles={CORREO_ROLES}><OleadaList /></RoleRoute>} />
          <Route path="/oleadas/nueva" element={<RoleRoute roles={CORREO_ROLES}><OleadaCreate /></RoleRoute>} />
          <Route path="/oleadas/:id" element={<RoleRoute roles={CORREO_ROLES}><OleadaDetail /></RoleRoute>} />
          <Route path="/actualizaciones-publicas" element={<RoleRoute roles={CORREO_ROLES}><PublicDataUpdateList /></RoleRoute>} />
          <Route path="/agentes" element={<RoleRoute roles={[]}><AgentList /></RoleRoute>} />
          <Route path="/rrhh/enviar" element={<RoleRoute roles={HR_ROLES}><SendContract /></RoleRoute>} />
          <Route path="/rrhh/contratos" element={<RoleRoute roles={HR_ROLES}><ContractList /></RoleRoute>} />
          <Route path="/rrhh/contratos/:id" element={<RoleRoute roles={HR_ROLES}><ContractDetail /></RoleRoute>} />
          <Route path="/reclutamiento/candidatos" element={<RoleRoute roles={RECLUTAMIENTO_ROLES}><CandidatoList /></RoleRoute>} />
          <Route path="/reclutamiento/candidatos/:id" element={<RoleRoute roles={RECLUTAMIENTO_ROLES}><CandidatoDetail /></RoleRoute>} />
          <Route path="/beemo/enviar" element={<RoleRoute roles={BEEMO_ROLES}><SendBeemo /></RoleRoute>} />
          <Route path="/beemo/documentos" element={<RoleRoute roles={BEEMO_ROLES}><BeemoList /></RoleRoute>} />
          <Route path="/beemo/documentos/:id" element={<RoleRoute roles={BEEMO_ROLES}><BeemoDetail /></RoleRoute>} />
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
