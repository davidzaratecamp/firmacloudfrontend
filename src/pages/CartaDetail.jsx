import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCarta, downloadCarta, getCartaPreviewUrl, deleteCarta } from '../api/cartas';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { ArrowLeft, Mail, MailOpen, PenLine, Clock, User, Phone, FileText, Download, Loader2, Eye, RefreshCw, Trash2 } from 'lucide-react';

const STATUS_BADGE = {
  pending:  { label: 'Pendiente',     cls: 'bg-yellow-100 text-yellow-800' },
  viewed:   { label: 'Email Abierto', cls: 'bg-blue-100 text-blue-800'    },
  signed:   { label: 'Firmado',       cls: 'bg-green-100 text-green-800'  },
  expired:  { label: 'Expirado',      cls: 'bg-red-100 text-red-800'      },
  failed:   { label: 'Fallido',       cls: 'bg-red-100 text-red-800'      },
};

function fmt(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CartaDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [carta, setCarta]         = useState(null);
  const [error, setError]         = useState('');
  const [downloading, setDownloading] = useState(false);

  const [previewUrl, setPreviewUrl]     = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dataModalOpen, setDataModalOpen]   = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [deleting, setDeleting]             = useState(false);

  const loadCarta = useCallback(() => {
    return getCarta(id)
      .then(r => setCarta(r.data))
      .catch(() => setError('No se pudo cargar el registro'));
  }, [id]);

  useEffect(() => { loadCarta(); }, [loadCarta]);

  if (error) {
    return <Layout><div className="text-center py-16 text-red-500">{error}</div></Layout>;
  }

  if (!carta) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const badge = STATUS_BADGE[carta.status] || { label: carta.status, cls: 'bg-gray-100 text-gray-800' };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCarta(carta.id, `FIRMADO-${carta.npn_name || carta.id}.pdf`);
    } catch {
      alert('No se pudo descargar el documento');
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const url = await getCartaPreviewUrl(carta.id);
      setPreviewUrl(url);
    } catch {
      alert('No se pudo cargar la vista previa');
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCarta();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar la carta fallida de ${carta.client_name}? No se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await deleteCarta(carta.id);
      navigate('/cartas');
    } catch {
      alert('No se pudo eliminar la carta');
      setDeleting(false);
    }
  };

  const timeline = [
    {
      key:  'sent',
      icon: <Mail className="h-4 w-4" />,
      label: 'Carta enviada',
      date:  fmt(carta.sent_at),
      done:  true,
    },
    {
      key:  'opened',
      icon: <MailOpen className="h-4 w-4" />,
      label: 'Email abierto',
      date:  fmt(carta.viewed_at),
      done:  !!carta.viewed_at,
      sub:   carta.signer_ip ? `IP: ${carta.signer_ip}` : null,
    },
    {
      key:  'signed',
      icon: <PenLine className="h-4 w-4" />,
      label: 'Documento firmado',
      date:  fmt(carta.signed_at),
      done:  !!carta.signed_at,
      sub:   carta.signer_name ? `Firmado por: ${carta.signer_name}` : null,
    },
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/cartas')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">Detalle de Carta</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refrescar
          </button>
          {carta.status === 'failed' && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Eliminar
            </button>
          )}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        {/* NPN + documento */}
        {carta.npn_name && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">{carta.npn_name}.pdf</p>
              <p className="text-xs text-blue-600">NPN: {carta.npn_code}</p>
            </div>
          </div>
        )}

        {/* Info cliente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Cliente</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-900 font-medium">{carta.client_name}</span>
            </div>
            {carta.client_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{carta.client_email}</span>
              </div>
            )}
            {carta.client_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{carta.client_phone}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium text-gray-600">Canal</span>
              <p className="mt-0.5 capitalize">{carta.send_channel}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Agente</span>
              <p className="mt-0.5">{carta.agent_name}</p>
            </div>
            {carta.sent_from_ip && (
              <div>
                <span className="font-medium text-gray-600">IP de envío</span>
                <p className="mt-0.5 font-mono">{carta.sent_from_ip}</p>
              </div>
            )}
          </div>
        </div>

        {/* Documento firmado — solo cuando está signed */}
        {carta.status === 'signed' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">Documento firmado disponible</p>
                <p className="text-xs text-green-600 mt-0.5">
                  Firmado por: <strong>{carta.signer_name}</strong> · {fmt(carta.signed_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handlePreview}
                disabled={previewLoading}
                className="flex items-center gap-2 border border-green-300 text-green-700 hover:bg-green-100 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {previewLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Eye className="h-4 w-4" />}
                Vista previa
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {downloading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Download className="h-4 w-4" />}
                {downloading ? 'Descargando...' : 'Descargar PDF'}
              </button>
            </div>
          </div>
        )}

        {/* Datos del formulario — solo cuando el cliente los haya enviado */}
        {carta.form_submitted_at && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Datos actualizados por el cliente
              </h2>
              <button
                onClick={() => setDataModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Eye className="h-3.5 w-3.5" /> Ver datos
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {carta.form_name && (
                <div><span className="text-gray-400 text-xs font-medium">Nombre</span><p className="text-gray-900 mt-0.5">{carta.form_name}</p></div>
              )}
              {carta.form_phone && (
                <div><span className="text-gray-400 text-xs font-medium">Teléfono</span><p className="text-gray-900 mt-0.5">{carta.form_phone}</p></div>
              )}
              {carta.form_email && (
                <div><span className="text-gray-400 text-xs font-medium">Email</span><p className="text-gray-900 mt-0.5">{carta.form_email}</p></div>
              )}
              {carta.form_postalcode && (
                <div><span className="text-gray-400 text-xs font-medium">Código postal</span><p className="text-gray-900 mt-0.5">{carta.form_postalcode}</p></div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">Enviado el {fmt(carta.form_submitted_at)}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Estado del proceso</h2>
          <div className="space-y-0">
            {timeline.map((step, i) => (
              <div key={step.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.done ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.done ? step.icon : <Clock className="h-4 w-4" />}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className={`w-0.5 h-8 mt-1 ${step.done ? 'bg-blue-200' : 'bg-gray-100'}`} />
                  )}
                </div>
                <div className="pb-8 flex-1">
                  <p className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {step.date && <p className="text-xs text-gray-500 mt-0.5">{step.date}</p>}
                  {step.sub  && <p className="text-xs text-gray-400 font-mono mt-0.5">{step.sub}</p>}
                  {!step.done && <p className="text-xs text-gray-300 mt-0.5">Pendiente</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <Modal open={!!previewUrl} onClose={closePreview} title="Vista previa del documento firmado" maxWidth="max-w-3xl">
        {previewUrl && (
          <iframe src={previewUrl} title="Vista previa PDF" className="w-full h-[75vh] rounded-lg border border-gray-200" />
        )}
      </Modal>

      <Modal open={dataModalOpen} onClose={() => setDataModalOpen(false)} title="Datos actualizados por el cliente">
        <div className="space-y-3 text-sm">
          {carta.form_name && (
            <div><span className="text-gray-400 text-xs font-medium">Nombre</span><p className="text-gray-900 mt-0.5">{carta.form_name}</p></div>
          )}
          {carta.form_phone && (
            <div><span className="text-gray-400 text-xs font-medium">Teléfono</span><p className="text-gray-900 mt-0.5">{carta.form_phone}</p></div>
          )}
          {carta.form_email && (
            <div><span className="text-gray-400 text-xs font-medium">Email</span><p className="text-gray-900 mt-0.5">{carta.form_email}</p></div>
          )}
          {carta.form_postalcode && (
            <div><span className="text-gray-400 text-xs font-medium">Código postal</span><p className="text-gray-900 mt-0.5">{carta.form_postalcode}</p></div>
          )}
          <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">Enviado el {fmt(carta.form_submitted_at)}</p>
        </div>
      </Modal>
    </Layout>
  );
}
