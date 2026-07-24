import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getContract, downloadSignedContract, deleteContract } from '../api/hrContracts';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { Download, ArrowLeft, FileCheck, Loader2, Trash2 } from 'lucide-react';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-3 border-b border-gray-50 last:border-0">
      <dt className="text-sm font-medium text-gray-500 sm:w-52 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 mt-1 sm:mt-0 break-all">{value}</dd>
    </div>
  );
}

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { getContract(id).then(r => setContract(r.data)); }, [id]);

  if (!contract) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </Layout>
  );

  const fmt = (d) => d ? new Date(d).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'N/A';

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/rrhh/contratos" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{contract.recipient_email || contract.recipient_phone}</h1>
          <p className="text-sm text-gray-500">{contract.document_name}</p>
        </div>
        <StatusBadge status={contract.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-600" />Información del Contrato
            </h2>
            <dl>
              <InfoRow label="ID" value={contract.id} />
              <InfoRow label="Canal de envío" value={contract.send_channel === 'email' ? 'Correo electrónico' : 'WhatsApp'} />
              <InfoRow label="Correo destinatario" value={contract.recipient_email} />
              <InfoRow label="Teléfono destinatario" value={contract.recipient_phone} />
              <InfoRow label="Agente" value={contract.agent_name} />
              <InfoRow label="Documento" value={contract.document_name} />
              <InfoRow label="Hash del Documento" value={contract.document_hash} />
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Registro de Fechas</h2>
            <dl>
              <InfoRow label="Fecha de Envío" value={fmt(contract.sent_at)} />
              <InfoRow label="Fecha de Visualización" value={fmt(contract.viewed_at)} />
              <InfoRow label="Fecha de Firma" value={fmt(contract.signed_at)} />
            </dl>
          </div>

          {contract.status === 'signed' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Evidencia de Firma</h2>
              <dl>
                <InfoRow label="Dirección IP" value={contract.signer_ip} />
                <InfoRow label="User-Agent" value={contract.signer_user_agent} />
              </dl>
            </div>
          )}
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          {contract.status === 'signed' && (
            <button
              onClick={async () => {
                setDownloading(true);
                try { await downloadSignedContract(id, contract.document_name); } finally { setDownloading(false); }
              }}
              disabled={downloading}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloading ? 'Descargando...' : 'Descargar PDF Firmado'}
            </button>
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
                      await deleteContract(id);
                      navigate('/rrhh/contratos');
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
                { key: 'viewed', label: 'Visualizado', done: ['viewed', 'signed'].includes(contract.status) },
                { key: 'signed', label: 'Firmado',     done: contract.status === 'signed' },
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
