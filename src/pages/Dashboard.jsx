import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/signatures';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { FileText, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${color}`}><Icon className="h-4 w-4 text-white" /></div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value ?? 0}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError('No se pudo cargar el dashboard. Intenta recargar la página.'));
  }, []);

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/enviar"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Send className="h-4 w-4" />Enviar Documento
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={data?.stats?.total} icon={FileText} color="bg-blue-500" />
        <StatCard label="Pendientes" value={data?.stats?.pending} icon={Clock} color="bg-yellow-500" />
        <StatCard label="Firmados" value={data?.stats?.signed} icon={CheckCircle} color="bg-green-500" />
        <StatCard label="Expirados" value={data?.stats?.expired} icon={AlertCircle} color="bg-red-500" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Actividad Reciente</h2>
          <Link to="/firmas" className="text-blue-600 text-sm hover:underline">Ver todo</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {data?.recent?.map(sig => (
            <Link
              key={sig.id}
              to={`/firmas/${sig.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{sig.client_name}</p>
                <p className="text-xs text-gray-500">{sig.document_name}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={sig.status} />
                <p className="text-xs text-gray-400 mt-1">{new Date(sig.sent_at).toLocaleDateString('es-CO')}</p>
              </div>
            </Link>
          ))}
          {!data?.recent?.length && (
            <p className="p-8 text-center text-gray-400 text-sm">No hay actividad reciente</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
