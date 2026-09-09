import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listBeemoDocuments, getBeemoStats } from '../api/beemo';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { Mail, MessageCircle, MailPlus, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = ['', 'pending', 'viewed', 'signed'];
const STATUS_LABELS = { '': 'Todos', pending: 'Pendientes', viewed: 'Vistos', signed: 'Firmados' };
const CHANNEL_ICON = { email: Mail, whatsapp: MessageCircle, both: MailPlus };

export default function BeemoList() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    listBeemoDocuments({ status, search: search || undefined, page, limit: 15 }).then(r => setData(r.data));
  }, [status, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getBeemoStats().then(r => setStats(r.data)); }, [data.total]);

  const totalPages = Math.ceil(data.total / 15);

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Documentos Beemo</h1>

      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['pending', 'viewed', 'signed'].map(key => (
            <div key={key} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{STATUS_LABELS[key]}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.counts[key] || 0}</p>
            </div>
          ))}
        </div>
      )}
      {stats && !stats.whatsappReady && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 inline-block">
          Número de WhatsApp Beemo en proceso de aprobación — el canal correo ya está disponible.
        </p>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
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
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre o documento..."
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="divide-y divide-gray-50">
          {data.data.map(d => {
            const Icon = CHANNEL_ICON[d.send_channel] || Mail;
            return (
              <Link
                key={d.id}
                to={`/beemo/documentos/${d.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 text-gray-400 flex-none" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{d.recipient_name}</p>
                    <p className="text-xs text-gray-500 truncate">{d.document_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-none">
                  <p className="hidden sm:block text-xs text-gray-400">{new Date(d.sent_at).toLocaleDateString('es-CO')}</p>
                  <StatusBadge status={d.status} />
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              </Link>
            );
          })}
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
