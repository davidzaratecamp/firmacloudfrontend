import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listContracts } from '../api/hrContracts';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { Mail, MessageCircle, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = ['', 'pending', 'viewed', 'signed'];
const STATUS_LABELS = { '': 'Todos', pending: 'Pendientes', viewed: 'Vistos', signed: 'Firmados' };

export default function ContractList() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    listContracts({ status, page, limit: 15 }).then(r => setData(r.data));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(data.total / 15);

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contratos Laborales</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
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
          {data.data.map(c => (
            <Link
              key={c.id}
              to={`/rrhh/contratos/${c.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {c.send_channel === 'email'
                  ? <Mail className="h-4 w-4 text-gray-400 flex-none" />
                  : <MessageCircle className="h-4 w-4 text-gray-400 flex-none" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {c.recipient_email || c.recipient_phone}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{c.document_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-none">
                <p className="hidden sm:block text-xs text-gray-400">{new Date(c.sent_at).toLocaleDateString('es-CO')}</p>
                <StatusBadge status={c.status} />
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
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </Layout>
  );
}
