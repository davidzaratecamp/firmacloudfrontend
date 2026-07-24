import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendContract } from '../api/hrContracts';
import Layout from '../components/Layout';
import { Send, CheckCircle, Loader2, Mail, MessageCircle, Upload, FileText, X, ArrowRight } from 'lucide-react';

const CHANNELS = [
  { value: 'email',    label: 'Email',    icon: Mail          },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

const COUNTRY_CODES = [
  { code: '+57', country: 'CO', label: '🇨🇴 +57 Colombia' },
  { code: '+1',  country: 'US', label: '🇺🇸 +1 Estados Unidos' },
  { code: '+1',  country: 'CA', label: '🇨🇦 +1 Canadá' },
  { code: '+52', country: 'MX', label: '🇲🇽 +52 México' },
  { code: '+54', country: 'AR', label: '🇦🇷 +54 Argentina' },
  { code: '+56', country: 'CL', label: '🇨🇱 +56 Chile' },
  { code: '+51', country: 'PE', label: '🇵🇪 +51 Perú' },
  { code: '+593', country: 'EC', label: '🇪🇨 +593 Ecuador' },
  { code: '+58', country: 'VE', label: '🇻🇪 +58 Venezuela' },
  { code: '+507', country: 'PA', label: '🇵🇦 +507 Panamá' },
];

export default function SendContract() {
  const [sendChannel, setSendChannel] = useState('email');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+57');
  const [file, setFile] = useState(null);
  const [customFilename, setCustomFilename] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const needsEmail = sendChannel === 'email';
  const needsPhone = sendChannel === 'whatsapp';

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('El archivo debe ser un PDF');
      return;
    }
    setError('');
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Sube el PDF del contrato');
    if (needsEmail && !recipientEmail.trim()) return setError('Correo del destinatario requerido');
    if (needsPhone && !recipientPhone.trim()) return setError('Número de WhatsApp del destinatario requerido');

    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('sendChannel', sendChannel);
      if (customFilename.trim()) fd.append('customFilename', customFilename.trim());
      if (needsEmail) fd.append('recipientEmail', recipientEmail.trim());
      if (needsPhone) fd.append('recipientPhone', `${countryCode}${recipientPhone.replace(/\D/g, '')}`);
      await sendContract(fd);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el contrato');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const ch = CHANNELS.find(c => c.value === sendChannel);
    return (
      <Layout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Contrato Enviado!</h2>
          <p className="text-gray-500 mb-1">Enviado por <strong>{ch?.label}</strong></p>
          {needsEmail && <p className="text-sm text-gray-400">{recipientEmail}</p>}
          {needsPhone && <p className="text-sm text-gray-400">{countryCode}{recipientPhone.replace(/\D/g, '')}</p>}
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => {
                setSuccess(false);
                setFile(null);
                setRecipientEmail('');
                setRecipientPhone('');
                setCustomFilename('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Enviar otro
            </button>
            <button onClick={() => navigate('/rrhh/contratos')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Ver contratos
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Enviar Contrato Laboral</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* PDF upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PDF del contrato *</label>
              {!file ? (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-500">Haz clic para subir el PDF</span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-blue-600 flex-none" />
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  </div>
                  <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 flex-none">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Nombre de archivo personalizado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del archivo <span className="text-xs text-gray-400 font-normal">(opcional)</span>
              </label>
              <input value={customFilename} onChange={e => setCustomFilename(e.target.value)}
                placeholder="Ej: FIRMADO-ANEXOS-Juan-Perez"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">
                Se usará al descargar el contrato firmado. Si lo dejas vacío, se usa el nombre por defecto.
              </p>
            </div>

            {/* Channel selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Canal de envío *</label>
              <div className="grid grid-cols-2 gap-2">
                {CHANNELS.map(ch => (
                  <button key={ch.value} type="button"
                    onClick={() => setSendChannel(ch.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-colors ${
                      sendChannel === ch.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <ch.icon className="h-4 w-4" />
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            {needsEmail && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo del destinatario *</label>
                <input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} type="email" required
                  placeholder="trabajador@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}

            {/* Phone */}
            {needsPhone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de WhatsApp * <span className="text-xs text-gray-400">(elige el código de país)</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    className="w-40 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.country} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <input value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} required
                    placeholder="3001234567"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Solo el número, sin el código de país (se agrega automáticamente)</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? 'Enviando...' : 'Enviar Contrato'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
