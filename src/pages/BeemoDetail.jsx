import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBeemoDocument, downloadBeemoSigned, deleteBeemoDocument, resendBeemoDocument } from '../api/beemo';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { Download, ArrowLeft, FileCheck, Loader2, Trash2, Send, CheckCircle } from 'lucide-react';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-3 border-b border-gray-50 last:border-0">
      <dt className="text-sm font-medium text-gray-500 sm:w-52 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 mt-1 sm:mt-0 break-all">{value}</dd>
    </div>
  );
}

export default function BeemoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  useEffect(() => { getBeemoDocument(id).then(r => setDoc(r.data)); }, [id]);

  if (!doc) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </Layout>
  );

  const fmt = (d) => d ? new Date(d).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'N/A';
  const SOURCE_LABELS = { template: 'Plantilla Beemo', upload: 'PDF cargado' };
  const CHANNEL_LABELS = { email: 'Correo electrónico', whatsapp: 'WhatsApp', both: 'Correo y WhatsApp' };

  const handleResend = async () => {
    setResending(true);
    setResendError('');
    setResendMessage('');
    try {
      const res = await resendBeemoDocument(id);
      setResendMessage(res.data.warning ? `${res.data.message} — ${res.data.warning}` : res.data.message);
      getBeemoDocument(id).then(r => setDoc(r.data));
    } catch (err) {
      setResendError(err.response?.data?.error || 'Error al reenviar el documento');
    } finally {
      setResending(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/beemo/documentos" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{doc.recipient_name}</h1>
          <p className="text-sm text-gray-500">{doc.document_name}</p>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-600" />Información del Documento
            </h2>
            <dl>
              <InfoRow label="ID" value={doc.id} />
              <InfoRow label="Origen" value={SOURCE_LABELS[doc.source]} />
              <InfoRow label="Canal de envío" value={CHANNEL_LABELS[doc.send_channel]} />
              <InfoRow label="Correo destinatario" value={doc.recipient_email} />
              <InfoRow label="Teléfono destinatario" value={doc.recipient_phone} />
              <InfoRow label="Agente" value={doc.agent_name} />
              <InfoRow label="Documento" value={doc.document_name} />
              <InfoRow label="Hash del Documento" value={doc.document_hash} />
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Registro de Fechas</h2>
            <dl>
              <InfoRow label="Fecha de Envío" value={fmt(doc.sent_at)} />
              <InfoRow label="Fecha de Visualización" value={fmt(doc.viewed_at)} />
              <InfoRow label="Fecha de Firma" value={fmt(doc.signed_at)} />
            </dl>
          </div>

          {doc.status === 'signed' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Evidencia de Firma</h2>
              <dl>
                <InfoRow label="Dirección IP" value={doc.signer_ip} />
                <InfoRow label="User-Agent" value={doc.signer_user_agent} />
              </dl>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {doc.status === 'signed' && (
            <button
              onClick={async () => {
                setDownloading(true);
                try { await downloadBeemoSigned(id, doc.document_name); } finally { setDownloading(false); }
              }}
              disabled={downloading}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloading ? 'Descargando...' : 'Descargar PDF Firmado'}
            </button>
          )}

          {doc.status !== 'signed' && (
            <div>
              <button
                onClick={handleResend}
                disabled={resending}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {resending ? 'Reenviando...' : 'Reenviar enlace de firma'}
              </button>
              <p className="text-xs text-gray-400 mt-1.5 text-center">
                Genera un enlace nuevo por {CHANNEL_LABELS[doc.send_channel]?.toLowerCase()} — el anterior deja de funcionar.
              </p>
              {resendMessage && (
                <p className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2">
                  <CheckCircle className="h-3.5 w-3.5 flex-none" />{resendMessage}
                </p>
              )}
              {resendError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">{resendError}</p>
              )}
            </div>
          )}

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center gap-2 w-full border border-red-300 text-red-600 hover:bg-red-50 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4" />Eliminar registro
            </button>
          ) : (
            <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-700 font-medium">¿Eliminar este registro?</p>
              <p className="text-xs text-red-500">Se borrarán el registro y todos los archivos asociados. Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await deleteBeemoDocument(id);
                      navigate('/beemo/documentos');
                    } catch {
                      setDeleting(false);
                      setConfirmDelete(false);
                    }
                  }}
                  className="flex-1 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Estado del Proceso</p>
            <div className="space-y-2">
              {[
                { key: 'sent',   label: 'Enviado',     done: true },
                { key: 'viewed', label: 'Visualizado', done: ['viewed', 'signed'].includes(doc.status) },
                { key: 'signed', label: 'Firmado',     done: doc.status === 'signed' },
              ].map(step => (
                <div
                  key={step.key}
                  className={`flex items-center gap-2 text-sm ${step.done ? 'text-green-700' : 'text-gray-400'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${step.done ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
