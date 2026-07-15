import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listCartas, exportCartas, deleteCarta } from '../api/cartas';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { Search, ChevronRight, Mail, MailOpen, PenLine, Clock, AlertTriangle, FileSpreadsheet, Loader2, RefreshCw, Trash2 } from 'lucide-react';

const LIMIT = 20;

const STATUS_OPTIONS = ['', 'pending', 'viewed', 'signed', 'expired', 'failed'];
const STATUS_LABELS  = {
  '':       'Todos',
  pending:  'Pendientes',
  viewed:   'Email Abierto',
  signed:   'Firmados',
  expired:  'Expirados',
  failed:   'Fallidos',
};

const STATUS_BADGE = {
  pending:  { label: 'Pendiente',     cls: 'bg-yellow-100 text-yellow-800' },
  viewed:   { label: 'Email Abierto', cls: 'bg-blue-100 text-blue-800'    },
  signed:   { label: 'Firmado',       cls: 'bg-green-100 text-green-800'  },
  expired:  { label: 'Expirado',      cls: 'bg-red-100 text-red-800'      },
  failed:   { label: 'Fallido',       cls: 'bg-red-100 text-red-800'      },
};

const STATUS_ICON = {
  pending:  <Clock        className="h-4 w-4 text-yellow-500" />,
  viewed:   <MailOpen     className="h-4 w-4 text-blue-500"   />,
  signed:   <PenLine      className="h-4 w-4 text-green-500"  />,
  expired:  <Clock        className="h-4 w-4 text-red-400"    />,
  failed:   <AlertTriangle className="h-4 w-4 text-red-500"   />,
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [page, setPage]     = useState(1);

  const [exportOpen, setExportOpen]     = useState(false);
  const [exporting, setExporting]       = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [deletingId, setDeletingId]     = useState(null);

  const load = useCallback(() => {
    return listCartas({ search, status, dateFrom, dateTo, page, limit: LIMIT }).then(r => setData(r.data));
  }, [search, status, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (e, carta) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar la carta fallida de ${carta.client_name}? No se puede deshacer.`)) return;
    setDeletingId(carta.id);
    try {
      await deleteCarta(carta.id);
      load();
    } catch {
      alert('No se pudo eliminar la carta');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(data.total / LIMIT);

  const activeFilters = [
    status && `Estado: ${STATUS_LABELS[status]}`,
    search && `Búsqueda: "${search}"`,
    dateFrom && `Desde: ${dateFrom}`,
    dateTo && `Hasta: ${dateTo}`,
  ].filter(Boolean);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCartas({ search, status, dateFrom, dateTo });
      setExportOpen(false);
    } catch {
      alert('No se pudo generar el Excel');
    } finally {
      setExporting(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="text-xs text-gray-500">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refrescar
          </button>
          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Exportar Excel
          </button>
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
                {carta.status === 'failed' && (
                  <button
                    onClick={(e) => handleDelete(e, carta)}
                    disabled={deletingId === carta.id}
                    title="Eliminar carta fallida"
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === carta.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
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

      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title="Exportar a Excel">
        <div className="space-y-4">
          {activeFilters.length > 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Se exportarán los registros con estos filtros:</p>
              <ul className="text-xs space-y-0.5">
                {activeFilters.map((f, i) => <li key={i}>· {f}</li>)}
              </ul>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
              No hay filtros activos — se exportarán <strong>todos</strong> los registros ({data.total} en total).
            </div>
          )}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            {exporting ? 'Generando...' : 'Descargar Excel'}
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
