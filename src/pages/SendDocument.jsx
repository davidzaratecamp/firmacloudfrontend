import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendDocument } from '../api/signatures';
import Layout from '../components/Layout';
import { Send, CheckCircle, Loader2, Mail, MessageCircle } from 'lucide-react';

const CHANNELS = [
  { value: 'email',    label: 'Email',           icon: Mail          },
  { value: 'whatsapp', label: 'WhatsApp',         icon: MessageCircle },
  { value: 'both',     label: 'Email + WhatsApp', icon: null          },
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
  { code: '+506', country: 'CR', label: '🇨🇷 +506 Costa Rica' },
  { code: '+502', country: 'GT', label: '🇬🇹 +502 Guatemala' },
  { code: '+503', country: 'SV', label: '🇸🇻 +503 El Salvador' },
  { code: '+504', country: 'HN', label: '🇭🇳 +504 Honduras' },
  { code: '+505', country: 'NI', label: '🇳🇮 +505 Nicaragua' },
  { code: '+591', country: 'BO', label: '🇧🇴 +591 Bolivia' },
  { code: '+595', country: 'PY', label: '🇵🇾 +595 Paraguay' },
  { code: '+598', country: 'UY', label: '🇺🇾 +598 Uruguay' },
  { code: '+1', country: 'DO', label: '🇩🇴 +1 República Dominicana' },
  { code: '+34', country: 'ES', label: '🇪🇸 +34 España' },
  { code: '+44', country: 'GB', label: '🇬🇧 +44 Reino Unido' },
  { code: '+33', country: 'FR', label: '🇫🇷 +33 Francia' },
  { code: '+49', country: 'DE', label: '🇩🇪 +49 Alemania' },
  { code: '+39', country: 'IT', label: '🇮🇹 +39 Italia' },
  { code: '+55', country: 'BR', label: '🇧🇷 +55 Brasil' },
  { code: '+86', country: 'CN', label: '🇨🇳 +86 China' },
  { code: '+91', country: 'IN', label: '🇮🇳 +91 India' },
];

export default function SendDocument() {
  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientPhone: '', sendChannel: 'email' });
  const [countryCode, setCountryCode] = useState('+57');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const needsEmail   = form.sendChannel === 'email'    || form.sendChannel === 'both';
  const needsPhone   = form.sendChannel === 'whatsapp' || form.sendChannel === 'both';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = needsPhone
        ? { ...form, clientPhone: `${countryCode}${form.clientPhone.replace(/\D/g, '')}` }
        : form;
      await sendDocument(payload);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el documento');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const ch = CHANNELS.find(c => c.value === form.sendChannel);
    return (
      <Layout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Documento Enviado!</h2>
          <p className="text-gray-500 mb-1">Enviado a <strong>{form.clientName}</strong> por <strong>{ch?.label}</strong></p>
          {form.clientEmail && <p className="text-sm text-gray-400">{form.clientEmail}</p>}
          {form.clientPhone && <p className="text-sm text-gray-400">{countryCode}{form.clientPhone.replace(/\D/g, '')}</p>}
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => { setSuccess(false); setForm({ clientName: '', clientEmail: '', clientPhone: '', sendChannel: form.sendChannel }); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Enviar otro
            </button>
            <button onClick={() => navigate('/firmas')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Ver firmas
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Enviar Documento para Firma</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium">📄 carta-tratamiento-de-datos.pdf</p>
            <p className="text-xs text-blue-600 mt-1">Enlace válido por 72 horas · Un solo uso</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Channel selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Canal de envío *</label>
              <div className="grid grid-cols-3 gap-2">
                {CHANNELS.map(ch => (
                  <button key={ch.value} type="button"
                    onClick={() => setForm(f => ({ ...f, sendChannel: ch.value }))}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-colors ${
                      form.sendChannel === ch.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {ch.value === 'both' ? (
                      <div className="flex gap-0.5">
                        <Mail className="h-4 w-4" /><MessageCircle className="h-4 w-4" />
                      </div>
                    ) : (
                      <ch.icon className="h-4 w-4" />
                    )}
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Client name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del cliente *</label>
              <input name="clientName" value={form.clientName} onChange={handleChange} required
                placeholder="Ej: Juan Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Email */}
            {needsEmail && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                <input name="clientEmail" type="email" value={form.clientEmail} onChange={handleChange} required={needsEmail}
                  placeholder="cliente@email.com"
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
                  <input name="clientPhone" value={form.clientPhone} onChange={handleChange} required={needsPhone}
                    placeholder="3001234567"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Solo el número, sin el código de país (se agrega automáticamente)</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? 'Enviando...' : 'Enviar Documento'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
