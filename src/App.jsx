import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/firmar/:token" element={<SignPage />} />
          <Route path="/formulario/:token" element={<FormularioPublico />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/enviar" element={<ProtectedRoute><SendDocument /></ProtectedRoute>} />
          <Route path="/firmas" element={<ProtectedRoute><SignatureList /></ProtectedRoute>} />
          <Route path="/firmas/:id" element={<ProtectedRoute><SignatureDetail /></ProtectedRoute>} />
          <Route path="/enviar-carta" element={<ProtectedRoute><SendCarta /></ProtectedRoute>} />
          <Route path="/cartas" element={<ProtectedRoute><CartaList /></ProtectedRoute>} />
          <Route path="/cartas/:id" element={<ProtectedRoute><CartaDetail /></ProtectedRoute>} />
          <Route path="/oleadas" element={<ProtectedRoute><OleadaList /></ProtectedRoute>} />
          <Route path="/oleadas/nueva" element={<ProtectedRoute><OleadaCreate /></ProtectedRoute>} />
          <Route path="/oleadas/:id" element={<ProtectedRoute><OleadaDetail /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
