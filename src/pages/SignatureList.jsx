import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listSignatures } from '../api/signatures';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { Search, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = ['', 'pending', 'viewed', 'signed', 'expired'];
const STATUS_LABELS = { '': 'Todos', pending: 'Pendientes', viewed: 'Vistos', signed: 'Firmados', expired: 'Expirados' };

export default function SignatureList() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    listSignatures({ search, status, page, limit: 15 }).then(r => setData(r.data));
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(data.total / 15);

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Firmas Digitales</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre o email..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-1">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {data.data.map(sig => (
            <Link
              key={sig.id}
              to={`/firmas/${sig.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{sig.client_name}</p>
                  <p className="text-xs text-gray-500">{sig.client_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-gray-500">{sig.document_name}</p>
                  <p className="text-xs text-gray-400">{new Date(sig.sent_at).toLocaleDateString('es-CO')}</p>
                </div>
                <StatusBadge status={sig.status} />
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </Link>
          ))}
          {!data.data.length && (
            <p className="p-8 text-center text-gray-400 text-sm">No se encontraron registros</p>
          )}
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Total: {data.total} registros</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
