import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendVitalDocument } from '../api/signatures';
import Layout from '../components/Layout';
import { Send, CheckCircle, Loader2, Mail, MessageCircle, MessageSquare, User, Briefcase, Home, FileSpreadsheet } from 'lucide-react';

const CHANNELS = [
  { value: 'email',    label: 'Email',           icon: Mail          },
  { value: 'whatsapp', label: 'WhatsApp',         icon: MessageCircle },
  { value: 'sms',      label: 'SMS',              icon: MessageSquare },
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
];

// Campos de la plantilla Carta CMS Vital — ver documentData.vital en el backend
// (claude/planObamaCareFirmaTratamiento.md). taxes/monthlyPay/deductible/gd/pd son
// numéricos (el backend antepone el signo $); sd es un porcentaje (se agrega el % aquí).
const EMPTY_VITAL = {
  agentName: '', agentNPN: '', agentPhone: '', agentEmail: '',
  householdContactName: '', householdContactPhone: '', householdContactEmail: '',
  taxes: '', company: '', plan: '', monthlyPay: '', deductible: '', gd: '', pd: '', sd: '',
};

function TextField({ label, value, onChange, required, placeholder, type = 'text', prefix, suffix }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      <div className="flex items-stretch">
        {prefix && (
          <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
            {prefix}
          </span>
        )}
        <input
          type={type}
          step={type === 'number' ? 'any' : undefined}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            prefix ? 'rounded-r-lg' : suffix ? 'rounded-l-lg border-r-0' : 'rounded-lg'
          }`}
        />
        {suffix && (
          <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-gray-500 text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="border-t border-gray-100 pt-5 mt-1 first:border-t-0 first:pt-0 first:mt-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export default function SendVitalDocument() {
  const [clientName, setClientName]   = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [sendChannel, setSendChannel] = useState('email');
  const [countryCode, setCountryCode] = useState('+57');
  const [vital, setVital] = useState(EMPTY_VITAL);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  const needsEmail = sendChannel === 'email'    || sendChannel === 'both';
  const needsPhone = sendChannel === 'whatsapp' || sendChannel === 'sms' || sendChannel === 'both';

  const setField = (key) => (e) => setVital(v => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        clientName,
        clientEmail: needsEmail ? clientEmail : undefined,
        clientPhone: needsPhone ? `${countryCode}${clientPhone.replace(/\D/g, '')}` : undefined,
        sendChannel,
        documentData: {
          vital: {
            ...vital,
            clientName,
            sd: vital.sd ? `${vital.sd}%` : '',
          },
        },
      };
      await sendVitalDocument(payload);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el documento');
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Documento Vital Enviado!</h2>
          <p className="text-gray-500 mb-1">Enviado a <strong>{clientName}</strong> por <strong>{ch?.label}</strong></p>
          {needsEmail && <p className="text-sm text-gray-400">{clientEmail}</p>}
          {needsPhone && <p className="text-sm text-gray-400">{countryCode}{clientPhone.replace(/\D/g, '')}</p>}
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => {
                setSuccess(false);
                setClientName(''); setClientEmail(''); setClientPhone('');
                setVital(EMPTY_VITAL);
              }}
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Enviar Documento Vital</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium">📄 Carta CMS Vital — Firma Tratamiento de Datos</p>
            <p className="text-xs text-blue-600 mt-1">Enlace válido por 72 horas · Un solo uso · Sin sumario/certificado post-firma</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <Section icon={User} title="Cliente y canal de envío">
              <div className="sm:col-span-2">
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
                      {ch.value === 'both' ? (
                        <div className="flex gap-0.5"><Mail className="h-4 w-4" /><MessageCircle className="h-4 w-4" /></div>
                      ) : (
                        <ch.icon className="h-4 w-4" />
                      )}
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              <TextField label="Nombre del cliente" required value={clientName}
                onChange={e => setClientName(e.target.value)} placeholder="Ej: Silvia Reyes Vilchis" />

              {needsEmail && (
                <TextField label="Correo electrónico" required type="email" value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)} placeholder="cliente@email.com" />
              )}

              {needsPhone && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {sendChannel === 'sms' ? 'Número de celular' : 'Número de WhatsApp'} * <span className="text-xs text-gray-400">(elige el código de país)</span>
                  </label>
                  <div className="flex gap-2">
                    <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                      className="w-40 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      {COUNTRY_CODES.map(c => <option key={c.country} value={c.code}>{c.label}</option>)}
                    </select>
                    <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} required
                      placeholder="3001234567"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Solo el número, sin el código de país (se agrega automáticamente)</p>
                </div>
              )}
            </Section>

            <Section icon={Briefcase} title="Agente (NPN)">
              <TextField label="Nombre del agente" required value={vital.agentName} onChange={setField('agentName')} placeholder="Ej: Luis Vitier" />
              <TextField label="NPN (Agent National Producer Number)" required value={vital.agentNPN} onChange={setField('agentNPN')} placeholder="Ej: 18771778" />
              <TextField label="Teléfono del agente" value={vital.agentPhone} onChange={setField('agentPhone')} placeholder="Ej: +1(786) 227-3915" />
              <TextField label="Email del agente" type="email" value={vital.agentEmail} onChange={setField('agentEmail')} placeholder="agente@email.com" />
            </Section>

            <Section icon={Home} title="Contacto principal del hogar">
              <TextField label="Nombre del contacto" value={vital.householdContactName} onChange={setField('householdContactName')} placeholder="Ej: Silvia Reyes Vilchis" />
              <TextField label="Teléfono del contacto" value={vital.householdContactPhone} onChange={setField('householdContactPhone')} placeholder="Ej: 6783687620" />
              <TextField label="Email del contacto" type="email" value={vital.householdContactEmail} onChange={setField('householdContactEmail')} placeholder="contacto@email.com" />
            </Section>

            <Section icon={FileSpreadsheet} title="Datos del plan">
              <TextField label="Taxes" prefix="$" type="number" value={vital.taxes} onChange={setField('taxes')} placeholder="30.09" />
              <TextField label="Company" value={vital.company} onChange={setField('company')} placeholder="Ej: OSCAR" />
              <TextField label="Plan" value={vital.plan} onChange={setField('plan')} placeholder="Ej: HMO" />
              <TextField label="Monthly pay" prefix="$" type="number" value={vital.monthlyPay} onChange={setField('monthlyPay')} placeholder="122.47" />
              <TextField label="Deductible" prefix="$" type="number" value={vital.deductible} onChange={setField('deductible')} placeholder="8000" />
              <TextField label="GD" prefix="$" type="number" value={vital.gd} onChange={setField('gd')} placeholder="3" />
              <TextField label="PD" prefix="$" type="number" value={vital.pd} onChange={setField('pd')} placeholder="0" />
              <TextField label="SD" suffix="%" type="number" value={vital.sd} onChange={setField('sd')} placeholder="50" />
            </Section>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? 'Enviando...' : 'Enviar Documento Vital'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
