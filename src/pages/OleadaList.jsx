import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listOleadas, getDailyUsage } from '../api/oleadas';
import Layout from '../components/Layout';
import { Search, ChevronRight, Plus, PlayCircle, PauseCircle, CheckCircle2, XCircle, Mail, AlertTriangle } from 'lucide-react';

function formatCountdown(resetsAt) {
  const diff = new Date(resetsAt).getTime() - Date.now();
  if (diff <= 0) return '0h 0m';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

// Cupo diario AUTOIMPUESTO (no es el límite real de Gmail, ver OLEADA_DAILY_EMAIL_CAP en
// el backend) — se refresca solo cada minuto para que la cuenta regresiva se mantenga viva.
function DailyUsageBanner() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    const load = () => getDailyUsage().then(r => setUsage(r.data)).catch(() => {});
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!usage) return null;
  const pct = Math.min(100, Math.round((usage.sentToday / usage.cap) * 100));

  return (
    <div className={`rounded-xl border p-4 mb-4 ${usage.capReached ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <p className={`flex items-center gap-2 text-sm font-semibold ${usage.capReached ? 'text-red-800' : 'text-blue-800'}`}>
          {usage.capReached ? <AlertTriangle className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
          {usage.capReached
            ? `Cupo diario de correos alcanzado (${usage.sentToday}/${usage.cap})`
            : `Correos enviados hoy: ${usage.sentToday}/${usage.cap}`}
        </p>
        {usage.capReached && (
          <p className="text-xs text-red-600">Se reinicia en {formatCountdown(usage.resetsAt)}</p>
        )}
      </div>
      <div className="w-full bg-white/60 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${usage.capReached ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const STATUS_OPTIONS = ['', 'active', 'paused', 'completed', 'cancelled'];
const STATUS_LABELS = {
  '': 'Todas',
  active: 'Activas',
  paused: 'Pausadas',
  completed: 'Completadas',
  cancelled: 'Canceladas',
};

const STATUS_BADGE = {
  active:    { label: 'Activa',      cls: 'bg-blue-100 text-blue-800'   },
  paused:    { label: 'Pausada',     cls: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completada',  cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada',   cls: 'bg-red-100 text-red-800'     },
};

const STATUS_ICON = {
  active:    <PlayCircle  className="h-4 w-4 text-blue-500"   />,
  paused:    <PauseCircle className="h-4 w-4 text-yellow-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  cancelled: <XCircle     className="h-4 w-4 text-red-400"    />,
};

function OleadaBadge({ status }) {
  const { label, cls } = STATUS_BADGE[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function OleadaList() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const load = useCallback(() => {
    listOleadas({ search, status, page, limit: 20 }).then(r => setData(r.data));
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(data.total / 20);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Oleadas</h1>
        <button
          onClick={() => navigate('/oleadas/nueva')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva oleada
        </button>
      </div>

      <DailyUsageBanner />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre o NPN..."
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

        <div className="divide-y divide-gray-50">
          {data.data.map(oleada => {
            const progress = oleada.total_recipients > 0
              ? Math.round((oleada.sent_count / oleada.total_recipients) * 100)
              : 0;
            return (
              <Link
                key={oleada.id}
                to={`/oleadas/${oleada.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">{STATUS_ICON[oleada.status]}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{oleada.name}</p>
                    <p className="text-xs text-gray-500">
                      NPN: {oleada.npn_name} · {oleada.daily_limit}/día
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end gap-1 w-32">
                    <p className="text-xs text-gray-500">{oleada.sent_count}/{oleada.total_recipients} enviados</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <OleadaBadge status={oleada.status} />
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              </Link>
            );
          })}
          {!data.data.length && (
            <p className="p-8 text-center text-gray-400 text-sm">No se encontraron oleadas</p>
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
