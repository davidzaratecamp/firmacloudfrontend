import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFormulario, submitFormulario } from '../api/cartas';
import {
  CheckCircle, Loader2, AlertCircle, FileSignature,
  Upload, X, PenLine, ClipboardList, ArrowRight, ExternalLink,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// WhatsApp URL parser appends trailing text — extract only the leading hex token.
function extractToken(raw) {
  const m = (raw || '').match(/^[a-f0-9]+/i);
  return m ? m[0] : raw || '';
}

function ImagePicker({ label, required, onChange }) {
  const inputRef = useRef();
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  const clear = () => {
    setPreview(null);
    setFileName('');
    onChange(null);
    inputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          <Upload className="h-6 w-6" />
          <span className="text-sm">Haz clic para seleccionar imagen</span>
          <span className="text-xs">JPG, PNG o WEBP · máx 5 MB</span>
        </button>
      ) : (
        <div className="relative border border-gray-200 rounded-lg overflow-hidden">
          <img src={preview} alt="preview" className="w-full max-h-48 object-cover" />
          <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <button type="button" onClick={clear} className="bg-white text-gray-800 rounded-full p-1.5 shadow hover:bg-red-50 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 px-3 py-2 truncate">{fileName}</p>
        </div>
      )}
    </div>
  );
}

export default function FormularioPublico() {
  const { token: rawToken } = useParams();
  const token    = extractToken(rawToken);
  const navigate = useNavigate();

  // steps: loading | pdf | form | success | error
  const [step, setStep]             = useState('loading');
  const [clientName, setClientName] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', email: '', postalcode: '' });
  const [socialFile, setSocialFile]                     = useState(null);
  const [statusMigratorioFile, setStatusMigratorioFile] = useState(null);

  // URL directa del PDF — el iframe la carga sin pasar por el ArrayBuffer de react-pdf
  const pdfUrl = `${API}/sign/${token}/document`;

  useEffect(() => {
    let cancelled = false;

    getFormulario(token)
      .then(r => {
        if (cancelled) return;
        setClientName(r.data.clientName);
        setStep('pdf');
      })
      .catch(err => {
        if (cancelled) return;
        const msg = err.response?.data?.error;
        setErrorMsg(err.response?.status === 409 ? (msg || 'Este formulario ya fue enviado.') : (msg || 'Enlace no válido.'));
        setStep('error');
      });

    return () => { cancelled = true; };
  }, [token]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    const fd = new FormData();
    fd.append('name',       form.name);
    fd.append('phone',      form.phone);
    fd.append('email',      form.email);
    fd.append('postalcode', form.postalcode);
    if (socialFile)           fd.append('social',            socialFile);
    if (statusMigratorioFile) fd.append('status_migratorio', statusMigratorioFile);
    try {
      await submitFormulario(token, fd);
      setStep('success');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al enviar el formulario. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Header ────────────────────────────────────────────────────────────────
  const TopBar = ({ subtitle }) => (
    <div className="flex-none" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', padding: '16px 20px' }}>
      <div className="flex items-center gap-2 mb-0.5">
        <FileSignature className="text-blue-200 h-5 w-5" />
        <span className="text-white font-bold text-base">Asiste Health Care</span>
      </div>
      {subtitle && <p className="text-blue-300 text-xs">{subtitle}</p>}
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#f4f7f9' }}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-500 text-sm mt-3">Verificando enlace...</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#f4f7f9' }}>
        <TopBar subtitle="Formulario de Actualización de Datos" />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center w-full max-w-sm">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mb-4">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Enlace no disponible</h2>
            <p className="text-gray-500 text-sm">{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  if (step === 'pdf') {
    return (
      <div className="flex flex-col h-[100dvh]">
        <TopBar subtitle={`Comunicado — ${clientName}`} />

        {/* Aviso */}
        <div className="flex-none bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-start gap-2">
          <ClipboardList className="h-4 w-4 text-blue-600 flex-none mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            Lea el comunicado completo y luego haga clic en <strong>"Actualizar mis datos"</strong> para continuar.
          </p>
        </div>

        {/* PDF en iframe — sin problemas de ArrayBuffer ni StrictMode */}
        <iframe
          src={pdfUrl}
          title="Comunicado oficial"
          className="flex-1 w-full border-0"
          style={{ minHeight: 0 }}
        />

        {/* Footer */}
        <div className="flex-none bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors flex-none"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir
          </a>
          <button
            onClick={() => setStep('form')}
            className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <ClipboardList className="h-4 w-4" />
            Actualizar mis datos
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Formulario ────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#f4f7f9' }}>
        <TopBar subtitle="Formulario de Actualización de Datos" />
        <div className="max-w-md mx-auto w-full px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-gray-600 text-sm mb-5">
              Hola <strong>{clientName}</strong>, por favor completa los siguientes datos.
            </p>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Tu nombre completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                <input name="phone" value={form.phone} onChange={handleChange} required placeholder="Ej: +573001234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="tu@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código postal *</label>
                <input name="postalcode" value={form.postalcode} onChange={handleChange} required placeholder="Ej: 110111"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <ImagePicker label="Seguro Social" required={false} onChange={setSocialFile} />
              <ImagePicker label="Estatus Migratorio" required={false} onChange={setStatusMigratorioFile} />

              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar formulario'}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">
              Tus datos serán tratados de forma segura y confidencial.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Éxito — ir a firmar ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f4f7f9' }}>
      <TopBar subtitle="Datos recibidos" />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center space-y-5 w-full max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">¡Datos enviados!</h2>
            <p className="text-gray-500 text-sm">
              Tus datos han sido recibidos correctamente.<br />
              El siguiente paso es firmar el documento.
            </p>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Haz clic para revisar y firmar el documento:</p>
            <button
              onClick={() => navigate(`/firmar/${token}`)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 rounded-xl text-base transition-colors shadow-sm"
            >
              <PenLine className="h-5 w-5" />
              Firmar Recibido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
