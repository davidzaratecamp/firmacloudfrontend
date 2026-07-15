import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import RoleRoute from './components/RoleRoute';
import { FIRMA_ROLES, CORREO_ROLES, defaultRouteForRole } from './utils/roles';
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
import OleadaList from './pages/OleadaList';
import OleadaCreate from './pages/OleadaCreate';
import OleadaDetail from './pages/OleadaDetail';
import AgentList from './pages/AgentList';
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
          <Route path="/dashboard" element={<RoleRoute roles={FIRMA_ROLES}><Dashboard /></RoleRoute>} />
          <Route path="/enviar" element={<RoleRoute roles={FIRMA_ROLES}><SendDocument /></RoleRoute>} />
          <Route path="/firmas" element={<RoleRoute roles={FIRMA_ROLES}><SignatureList /></RoleRoute>} />
          <Route path="/firmas/:id" element={<RoleRoute roles={FIRMA_ROLES}><SignatureDetail /></RoleRoute>} />
          <Route path="/enviar-carta" element={<RoleRoute roles={CORREO_ROLES}><SendCarta /></RoleRoute>} />
          <Route path="/cartas" element={<RoleRoute roles={CORREO_ROLES}><CartaList /></RoleRoute>} />
          <Route path="/cartas/:id" element={<RoleRoute roles={CORREO_ROLES}><CartaDetail /></RoleRoute>} />
          <Route path="/oleadas" element={<RoleRoute roles={CORREO_ROLES}><OleadaList /></RoleRoute>} />
          <Route path="/oleadas/nueva" element={<RoleRoute roles={CORREO_ROLES}><OleadaCreate /></RoleRoute>} />
          <Route path="/oleadas/:id" element={<RoleRoute roles={CORREO_ROLES}><OleadaDetail /></RoleRoute>} />
          <Route path="/agentes" element={<RoleRoute roles={[]}><AgentList /></RoleRoute>} />
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
