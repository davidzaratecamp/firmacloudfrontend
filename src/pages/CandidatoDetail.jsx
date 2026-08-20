import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCandidato, downloadCandidatoCv, downloadCandidatoTratamiento } from '../api/reclutamiento';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { Download, ArrowLeft, FileCheck, Loader2 } from 'lucide-react';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-3 border-b border-gray-50 last:border-0">
      <dt className="text-sm font-medium text-gray-500 sm:w-52 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 mt-1 sm:mt-0 break-all">{value}</dd>
    </div>
  );
}

export default function CandidatoDetail() {
  const { id } = useParams();
  const [candidato, setCandidato] = useState(null);
  const [downloading, setDownloading] = useState(null); // 'cv' | 'tratamiento' | null

  useEffect(() => { getCandidato(id).then(r => setCandidato(r.data)); }, [id]);

  if (!candidato) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </Layout>
  );

  const fmt = (d) => d ? new Date(d).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'N/A';

  const handleDownload = async (tipo) => {
    setDownloading(tipo);
    try {
      if (tipo === 'cv') await downloadCandidatoCv(id, candidato.candidate_name);
      else await downloadCandidatoTratamiento(id, candidato.candidate_name);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/reclutamiento/candidatos" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{candidato.candidate_name}</h1>
          <p className="text-sm text-gray-500">{candidato.candidate_email || candidato.candidate_phone}</p>
        </div>
        <StatusBadge status={candidato.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-600" />Información del Candidato
            </h2>
            <dl>
              <InfoRow label="ID" value={candidato.id} />
              <InfoRow label="Canal de envío" value={candidato.send_channel === 'email' ? 'Correo electrónico' : 'WhatsApp'} />
              <InfoRow label="Correo" value={candidato.candidate_email} />
              <InfoRow label="Teléfono" value={candidato.candidate_phone} />
              <InfoRow label="Referencia en Hydra" value={candidato.hydra_reference_id} />
              <InfoRow label="Hash hoja de vida" value={candidato.cv_hash} />
              <InfoRow label="Hash tratamiento de datos" value={candidato.tratamiento_hash} />
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Registro de Fechas</h2>
            <dl>
              <InfoRow label="Fecha de Envío" value={fmt(candidato.sent_at)} />
              <InfoRow label="Fecha de Visualización" value={fmt(candidato.viewed_at)} />
              <InfoRow label="Fecha de Firma" value={fmt(candidato.signed_at)} />
            </dl>
          </div>

          {candidato.status === 'signed' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Evidencia de Firma</h2>
              <dl>
                <InfoRow label="Dirección IP" value={candidato.signer_ip} />
                <InfoRow label="User-Agent" value={candidato.signer_user_agent} />
              </dl>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="space-y-4">
          {candidato.status === 'signed' && (
            <div className="space-y-2">
              <button
                onClick={() => handleDownload('cv')}
                disabled={downloading !== null}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                {downloading === 'cv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloading === 'cv' ? 'Descargando...' : 'Descargar Hoja de Vida'}
              </button>
              <button
                onClick={() => handleDownload('tratamiento')}
                disabled={downloading !== null}
                className="flex items-center justify-center gap-2 w-full bg-white border border-blue-200 hover:bg-blue-50 disabled:opacity-60 text-blue-700 font-medium py-3 px-4 rounded-xl transition-colors"
              >
                {downloading === 'tratamiento' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloading === 'tratamiento' ? 'Descargando...' : 'Descargar Tratamiento de Datos'}
              </button>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Estado del Proceso</p>
            <div className="space-y-2">
              {[
                { key: 'sent',   label: 'Enviado',     done: true },
                { key: 'viewed', label: 'Visualizado', done: ['viewed', 'signed'].includes(candidato.status) },
                { key: 'signed', label: 'Firmado',     done: candidato.status === 'signed' },
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
