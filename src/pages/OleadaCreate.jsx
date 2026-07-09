import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOleada } from '../api/oleadas';
import { NPNS } from '../constants/npns';
import Layout from '../components/Layout';
import {
  Upload, Loader2, AlertCircle, ChevronDown, Mail, MessageCircle,
  CheckCircle, FileWarning, ArrowRight,
} from 'lucide-react';

const CHANNELS = [
  { value: 'email',    label: 'Email',           icon: Mail          },
  { value: 'whatsapp', label: 'WhatsApp',         icon: MessageCircle },
  { value: 'both',     label: 'Email + WhatsApp', icon: null          },
];

export default function OleadaCreate() {
  const [selectedNpn, setSelectedNpn] = useState(null);
  const [name, setName] = useState('');
  const [sendChannel, setSendChannel] = useState('email');
  const [dailyLimit, setDailyLimit] = useState('20');
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNpn) return setError('Selecciona un NPN');
    if (!name.trim()) return setError('Ponle un nombre a la oleada');
    if (!file) return setError('Sube un archivo CSV o Excel con los clientes');
    if (!dailyLimit || parseInt(dailyLimit) <= 0) return setError('El límite diario debe ser mayor a 0');

    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('npnName', selectedNpn.name);
      fd.append('npnCode', selectedNpn.code);
      fd.append('name', name.trim());
      fd.append('sendChannel', sendChannel);
      fd.append('dailyLimit', dailyLimit);
      fd.append('file', file);
      const { data } = await createOleada(fd);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la oleada');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Oleada creada</h2>
          <p className="text-gray-500 text-sm mb-4">
            {result.validRows} destinatario{result.validRows !== 1 ? 's' : ''} cargado{result.validRows !== 1 ? 's' : ''} · {result.oleada.dailyLimit}/día
          </p>

          {result.invalidRows?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 text-left mb-4">
              <p className="font-medium mb-2 flex items-center gap-1.5">
                <FileWarning className="h-4 w-4" />
                {result.invalidRows.length} fila{result.invalidRows.length !== 1 ? 's' : ''} omitida{result.invalidRows.length !== 1 ? 's' : ''}:
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.invalidRows.map((r, i) => (
                  <p key={i} className="text-xs">· Fila {r.row}: {r.reason}</p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate(`/oleadas/${result.oleada.id}`)}
            className="flex items-center gap-2 justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Ver oleada
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva Oleada</h1>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">1. Nombre de la oleada</h2>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Oleada julio 2026 - Melanie Granados"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">2. Seleccionar NPN</h2>
            <div className="relative">
              <select
                value={selectedNpn?.code || ''}
                onChange={e => {
                  const npn = NPNS.find(n => n.code === e.target.value);
                  setSelectedNpn(npn || null);
                }}
                className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
              >
                <option value="">-- Elige un NPN --</option>
                {NPNS.map(n => (
                  <option key={n.code} value={n.code}>{n.name} — {n.code}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">3. Canal de envío</h2>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map(ch => (
                <button key={ch.value} type="button"
                  onClick={() => setSendChannel(ch.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-colors ${
                    sendChannel === ch.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {ch.value === 'both'
                    ? <div className="flex gap-0.5"><Mail className="h-4 w-4" /><MessageCircle className="h-4 w-4" /></div>
                    : <ch.icon className="h-4 w-4" />
                  }
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">4. Límite de envíos por día</h2>
            <input
              type="number"
              min="1"
              value={dailyLimit}
              onChange={e => setDailyLimit(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              El sistema enviará este número de cartas automáticamente cada día hasta agotar la lista.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">5. Lista de clientes (CSV o Excel)</h2>
            <label className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer">
              <Upload className="h-6 w-6" />
              <span className="text-sm">{file ? file.name : 'Haz clic para seleccionar el archivo'}</span>
              <span className="text-xs">Columnas: nombre, email{sendChannel !== 'email' ? ', telefono' : ''}</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={e => setFile(e.target.files[0] || null)}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando oleada...</>
              : 'Crear oleada'
            }
          </button>
        </form>
      </div>
    </Layout>
  );
}
