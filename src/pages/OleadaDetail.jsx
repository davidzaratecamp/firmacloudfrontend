import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getOleada, listOleadaRecipients, sendOleadaNow,
  pauseOleada, resumeOleada, cancelOleada,
} from '../api/oleadas';
import Layout from '../components/Layout';
import {
  ArrowLeft, FileText, Send, Loader2, Clock, MailOpen, PenLine,
  AlertTriangle, PauseCircle, PlayCircle, XCircle, RefreshCw,
} from 'lucide-react';

const OLEADA_STATUS_BADGE = {
  active:    { label: 'Activa',     cls: 'bg-blue-100 text-blue-800'     },
  paused:    { label: 'Pausada',    cls: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completada', cls: 'bg-green-100 text-green-800'   },
  cancelled: { label: 'Cancelada',  cls: 'bg-red-100 text-red-800'       },
};

const RECIPIENT_FILTERS = [
  { value: '',        label: 'Todos'     },
  { value: 'pending', label: 'Pendiente' },
  { value: 'sent',    label: 'Enviado'   },
  { value: 'viewed',  label: 'Abierto'   },
  { value: 'signed',  label: 'Firmado'   },
  { value: 'failed',  label: 'Fallido'   },
];

const ROW_ICON = {
  pending: <Clock     className="h-4 w-4 text-gray-400"   />,
  sent:    <Send      className="h-4 w-4 text-blue-500"   />,
  viewed:  <MailOpen  className="h-4 w-4 text-blue-500"   />,
  signed:  <PenLine   className="h-4 w-4 text-green-500"  />,
  failed:  <AlertTriangle className="h-4 w-4 text-red-500" />,
};

function fmt(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function recipientState(r) {
  if (r.row_status === 'failed') return 'failed';
  if (r.row_status === 'pending') return 'pending';
  if (r.carta_status === 'signed') return 'signed';
  if (r.carta_status === 'viewed') return 'viewed';
  return 'sent';
}

export default function OleadaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [oleada, setOleada] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const [recipients, setRecipients] = useState({ data: [], total: 0 });
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const loadOleada = useCallback(() => {
    return getOleada(id).then(r => setOleada(r.data)).catch(() => setError('No se pudo cargar la oleada'));
  }, [id]);

  const loadRecipients = useCallback(() => {
    return listOleadaRecipients(id, { filter: filter || undefined, page, limit: 20 }).then(r => setRecipients(r.data));
  }, [id, filter, page]);

  useEffect(() => { loadOleada(); }, [loadOleada]);
  useEffect(() => { loadRecipients(); }, [loadRecipients]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadOleada(), loadRecipients()]);
    } finally {
      setRefreshing(false);
    }
  };

  if (error) return <Layout><div className="text-center py-16 text-red-500">{error}</div></Layout>;
  if (!oleada) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const badge = OLEADA_STATUS_BADGE[oleada.status] || { label: oleada.status, cls: 'bg-gray-100 text-gray-800' };
  const isDrip = oleada.send_mode === 'drip';
  const today = new Date().toISOString().slice(0, 10);
  const sentToday = oleada.last_batch_sent_date && String(oleada.last_batch_sent_date).slice(0, 10) === today;
  const dripIntervalMs = 10 * 60 * 1000; // debe coincidir con OLEADA_DRIP_INTERVAL_MINUTES (default backend: 10)
  const dripOnCooldown = isDrip && oleada.last_batch_sent_at
    && (new Date().getTime() - new Date(oleada.last_batch_sent_at).getTime()) < dripIntervalMs;
  const sendDisabled = isDrip ? dripOnCooldown : sentToday;
  const totalPages = Math.ceil(recipients.total / 20);

  const handleSendNow = async () => {
    setSending(true);
    setActionMsg('');
    try {
      const { data } = await sendOleadaNow(id);
      if (data.skipped) setActionMsg('Ya se envió el lote de hoy.');
      else setActionMsg(`Enviados: ${data.sent} · Fallidos: ${data.failed} · Restantes: ${data.remaining}`);
      loadOleada();
      loadRecipients();
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Error al enviar el lote');
    } finally {
      setSending(false);
    }
  };

  const handleStatusAction = async (action) => {
    try {
      await action(id);
      loadOleada();
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'No se pudo actualizar el estado');
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/oleadas')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">{oleada.name}</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refrescar
          </button>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">{oleada.npn_name}.pdf</p>
            <p className="text-xs text-blue-600">
              NPN: {oleada.npn_code} · Canal: {oleada.send_channel} ·{' '}
              {isDrip ? 'Goteo: 10 cada 10 min' : `${oleada.daily_limit}/día`}
            </p>
          </div>
        </div>

        {/* Contadores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Progreso</h2>
          <div className="grid grid-cols-5 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">{oleada.counts?.pending_count || 0}</p>
              <p className="text-xs text-gray-500">Pendiente</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{oleada.counts?.sent_count || 0}</p>
              <p className="text-xs text-gray-500">Enviado</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{oleada.counts?.viewed_count || 0}</p>
              <p className="text-xs text-gray-500">Abierto</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">{oleada.counts?.signed_count || 0}</p>
              <p className="text-xs text-gray-500">Firmado</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-500">{oleada.counts?.failed_count || 0}</p>
              <p className="text-xs text-gray-500">Fallido</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            {oleada.sent_count}/{oleada.total_recipients} enviados en total
            {isDrip
              ? oleada.last_batch_sent_at && ` · último lote: ${fmt(oleada.last_batch_sent_at)}`
              : oleada.last_batch_sent_date && ` · último lote: ${fmt(oleada.last_batch_sent_date)}`}
          </p>
        </div>

        {/* Acciones */}
        {actionMsg && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 mb-4">{actionMsg}</div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {oleada.status === 'active' && (
            <button
              onClick={handleSendNow}
              disabled={sending || sendDisabled}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isDrip
                ? (dripOnCooldown ? 'Envío automático en curso' : 'Forzar lote ahora')
                : (sentToday ? 'Ya enviado hoy' : 'Enviar lote de hoy')}
            </button>
          )}
          {oleada.status === 'active' && (
            <button
              onClick={() => handleStatusAction(pauseOleada)}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PauseCircle className="h-4 w-4" /> Pausar
            </button>
          )}
          {oleada.status === 'paused' && (
            <button
              onClick={() => handleStatusAction(resumeOleada)}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PlayCircle className="h-4 w-4" /> Reanudar
            </button>
          )}
          {(oleada.status === 'active' || oleada.status === 'paused') && (
            <button
              onClick={() => handleStatusAction(cancelOleada)}
              className="flex items-center gap-2 border border-red-200 text-red-600 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <XCircle className="h-4 w-4" /> Cancelar
            </button>
          )}
        </div>

        {/* Destinatarios */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2">
            {RECIPIENT_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="divide-y divide-gray-50">
            {recipients.data.map(r => {
              const state = recipientState(r);
              const clickable = Boolean(r.signature_request_id);
              return (
                <div
                  key={r.id}
                  onClick={clickable ? () => navigate(`/cartas/${r.signature_request_id}`) : undefined}
                  className={`flex items-center justify-between p-4 ${clickable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {ROW_ICON[state]}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500">
                        {r.email || r.phone}
                        {r.send_error && <span className="ml-2 text-red-500">· {r.send_error}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-400">{fmt(r.sent_at)}</p>
                    {clickable && <span className="text-xs text-blue-600 font-medium">Ver carta →</span>}
                  </div>
                </div>
              );
            })}
            {!recipients.data.length && (
              <p className="p-8 text-center text-gray-400 text-sm">Sin destinatarios en este filtro</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">Total: {recipients.total}</p>
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
      </div>
    </Layout>
  );
}
