import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendCarta } from '../api/cartas';
import { NPNS } from '../constants/npns';
import Layout from '../components/Layout';
import {
  Send, CheckCircle, Loader2, Mail, MessageCircle,
  UserPlus, X, AlertCircle, ChevronDown, Users,
} from 'lucide-react';

const CHANNELS = [
  { value: 'email',    label: 'Email',           icon: Mail          },
  { value: 'whatsapp', label: 'WhatsApp',         icon: MessageCircle },
  { value: 'both',     label: 'Email + WhatsApp', icon: null          },
];

const COUNTRY_CODES = [
  { code: '+1',  label: '🇺🇸 +1'  },
  { code: '+57', label: '🇨🇴 +57' },
  { code: '+52', label: '🇲🇽 +52' },
  { code: '+54', label: '🇦🇷 +54' },
  { code: '+34', label: '🇪🇸 +34' },
  { code: '+44', label: '🇬🇧 +44' },
];

const emptyRecipient = () => ({ name: '', email: '', phone: '', countryCode: '+1' });

export default function SendCarta() {
  const [selectedNpn, setSelectedNpn] = useState(null);
  const [sendChannel, setSendChannel] = useState('email');

  const [draft, setDraft] = useState(emptyRecipient());
  const [recipients, setRecipients] = useState([]);
  const [draftError, setDraftError] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const needsEmail = sendChannel === 'email'    || sendChannel === 'both';
  const needsPhone = sendChannel === 'whatsapp' || sendChannel === 'both';

  /* ── Add recipient to list ── */
  const addRecipient = () => {
    setDraftError('');
    if (!draft.name.trim()) return setDraftError('El nombre es requerido');
    if (needsEmail && !draft.email.trim()) return setDraftError('El email es requerido');
    if (needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email))
      return setDraftError('Email inválido');
    if (needsPhone && !draft.phone.trim()) return setDraftError('El teléfono es requerido');

    setRecipients(r => [...r, {
      name:  draft.name.trim(),
      email: draft.email.trim() || undefined,
      phone: needsPhone ? `${draft.countryCode}${draft.phone.replace(/\D/g, '')}` : undefined,
    }]);
    setDraft(emptyRecipient());
  };

  const removeRecipient = (i) => setRecipients(r => r.filter((_, idx) => idx !== i));

  /* ── Send ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNpn) return setError('Selecciona un NPN');
    if (recipients.length === 0) return setError('Agrega al menos un destinatario');
    setError('');
    setLoading(true);
    try {
      const { data } = await sendCarta({
        npnName: selectedNpn.name,
        npnCode: selectedNpn.code,
        sendChannel,
        recipients,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (result) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {result.sent} carta{result.sent !== 1 ? 's' : ''} enviada{result.sent !== 1 ? 's' : ''}
          </h2>
          <p className="text-gray-500 text-sm mb-1">NPN: <strong>{selectedNpn?.name}</strong> · {selectedNpn?.code}</p>

          {result.failed > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 text-left mt-4">
              <p className="font-medium mb-1">{result.failed} envío{result.failed > 1 ? 's' : ''} fallido{result.failed > 1 ? 's' : ''}:</p>
              {result.errors?.map((e, i) => (
                <p key={i} className="text-xs">· {e.recipient?.name}: {e.error}</p>
              ))}
            </div>
          )}

          <div className="mt-4 bg-gray-50 rounded-lg divide-y divide-gray-100 text-left text-sm">
            {result.results.map(r => (
              <div key={r.id} className="flex items-center gap-2 px-4 py-2">
                <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{r.clientName}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => { setResult(null); setRecipients([]); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Enviar otra
            </button>
            <button
              onClick={() => navigate('/cartas')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Ver cartas
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Enviar Carta Formulario</h1>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 1. NPN ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">1. Seleccionar NPN</h2>
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
                  <option key={n.code} value={n.code}>
                    {n.name} — {n.code}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {selectedNpn && (
              <div className="mt-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="text-sm font-medium text-blue-800">{selectedNpn.name}.pdf</p>
                  <p className="text-xs text-blue-600">NPN: {selectedNpn.code}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── 2. Canal ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">2. Canal de envío</h2>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map(ch => (
                <button key={ch.value} type="button"
                  onClick={() => { setSendChannel(ch.value); setRecipients([]); setDraft(emptyRecipient()); }}
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

          {/* ── 3. Destinatarios ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">3. Destinatarios</h2>
              {recipients.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                  <Users className="h-3.5 w-3.5" />{recipients.length} agregado{recipients.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Mini-form */}
            <div className="space-y-2 mb-3">
              <input
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="Nombre del destinatario"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {needsEmail && (
                <input
                  type="email"
                  value={draft.email}
                  onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
                  placeholder="Email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {needsPhone && (
                <div className="flex gap-2">
                  <select
                    value={draft.countryCode}
                    onChange={e => setDraft(d => ({ ...d, countryCode: e.target.value }))}
                    className="w-24 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <input
                    value={draft.phone}
                    onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))}
                    placeholder="Número de teléfono"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {draftError && (
                <p className="text-xs text-red-600">{draftError}</p>
              )}

              <button
                type="button"
                onClick={addRecipient}
                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg text-sm font-medium hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Agregar destinatario
              </button>
            </div>

            {/* Lista de destinatarios agregados */}
            {recipients.length > 0 && (
              <div className="space-y-1.5 border-t border-gray-100 pt-3">
                {recipients.map((r, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.name}</p>
                      <p className="text-xs text-gray-500">
                        {[r.email, r.phone].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRecipient(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Enviar ── */}
          <button
            type="submit"
            disabled={loading || !selectedNpn || recipients.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
              : <><Send className="h-4 w-4" />
                  Enviar a {recipients.length} destinatario{recipients.length !== 1 ? 's' : ''}
                </>
            }
          </button>

        </form>
      </div>
    </Layout>
  );
}
