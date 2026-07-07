import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listCartas } from '../api/cartas';
import Layout from '../components/Layout';
import { Search, ChevronRight, Mail, MailOpen, PenLine, Clock } from 'lucide-react';

const STATUS_OPTIONS = ['', 'pending', 'viewed', 'signed', 'expired'];
const STATUS_LABELS  = {
  '':       'Todos',
  pending:  'Pendientes',
  viewed:   'Email Abierto',
  signed:   'Firmados',
  expired:  'Expirados',
};

const STATUS_BADGE = {
  pending:  { label: 'Pendiente',     cls: 'bg-yellow-100 text-yellow-800' },
  viewed:   { label: 'Email Abierto', cls: 'bg-blue-100 text-blue-800'    },
  signed:   { label: 'Firmado',       cls: 'bg-green-100 text-green-800'  },
  expired:  { label: 'Expirado',      cls: 'bg-red-100 text-red-800'      },
};

const STATUS_ICON = {
  pending:  <Clock    className="h-4 w-4 text-yellow-500" />,
  viewed:   <MailOpen className="h-4 w-4 text-blue-500"   />,
  signed:   <PenLine  className="h-4 w-4 text-green-500"  />,
  expired:  <Clock    className="h-4 w-4 text-red-400"    />,
};

function CartaBadge({ status }) {
  const { label, cls } = STATUS_BADGE[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function CartaList() {
  const [data, setData]     = useState({ data: [], total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage]     = useState(1);

  const load = useCallback(() => {
    listCartas({ search, status, page, limit: 15 }).then(r => setData(r.data));
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(data.total / 15);

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cartas para Firma</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Filtros */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, email o NPN..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
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

        {/* Lista */}
        <div className="divide-y divide-gray-50">
          {data.data.map(carta => (
            <Link
              key={carta.id}
              to={`/cartas/${carta.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {STATUS_ICON[carta.status] || <Mail className="h-4 w-4 text-gray-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{carta.client_name}</p>
                  <p className="text-xs text-gray-500">
                    {carta.client_email || carta.client_phone}
                    {carta.npn_name && <span className="ml-2 text-gray-400">· NPN: {carta.npn_name}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-gray-500 capitalize">{carta.send_channel}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(carta.sent_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <CartaBadge status={carta.status} />
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </Link>
          ))}
          {!data.data.length && (
            <p className="p-8 text-center text-gray-400 text-sm">No se encontraron registros</p>
          )}
        </div>

        {/* Paginación */}
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
