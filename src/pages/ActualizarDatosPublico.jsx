import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { submitPublicDataUpdate } from '../api/publicDataUpdate';
import { NPNS, findNpnBySlug } from '../constants/npns';
import { CheckCircle, Loader2, AlertCircle, FileSignature, Upload, X, UserCheck } from 'lucide-react';

const INSURER_OPTIONS = [
  { value: 'oscar',    label: 'Oscar' },
  { value: 'ambetter', label: 'Ambetter Health' },
];

function TopBar({ subtitle }) {
  return (
    <div className="flex-none" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', padding: '16px 20px' }}>
      <div className="flex items-center gap-2 mb-0.5">
        <FileSignature className="text-blue-200 h-5 w-5" />
        <span className="text-white font-bold text-base">Asiste Health Care</span>
      </div>
      {subtitle && <p className="text-blue-300 text-xs">{subtitle}</p>}
    </div>
  );
}

function ImagePicker({ label, onChange }) {
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          <Upload className="h-6 w-6" />
          <span className="text-sm">Haz clic para seleccionar imagen</span>
          <span className="text-xs">JPG, PNG o WEBP · máx 10 MB</span>
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

export default function ActualizarDatosPublico() {
  const { npnSlug } = useParams();
  // Link por NPN (/actualizar-datos/:npnSlug): el agente viene fijo en la URL, no se pide.
  // Sin slug (/actualizar-datos): fallback genérico con selector manual.
  const lockedNpn = npnSlug ? findNpnBySlug(npnSlug) : null;
  const invalidSlug = !!npnSlug && !lockedNpn;

  const [step, setStep] = useState(invalidSlug ? 'error' : 'form'); // form | success | error
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(invalidSlug ? 'Enlace no válido.' : '');

  const [form, setForm] = useState({ npnName: lockedNpn?.name || '', name: '', phone: '', email: '', postalcode: '', insurer: '' });
  const [socialFile, setSocialFile] = useState(null);
  const [statusMigratorioFile, setStatusMigratorioFile] = useState(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const npn = NPNS.find(n => n.name === form.npnName);
    const fd = new FormData();
    fd.append('npnName',    form.npnName);
    if (npn) fd.append('npnCode', npn.code);
    fd.append('name',       form.name);
    fd.append('phone',      form.phone);
    fd.append('email',      form.email);
    fd.append('postalcode', form.postalcode);
    fd.append('insurer',    form.insurer);
    if (socialFile)           fd.append('social',            socialFile);
    if (statusMigratorioFile) fd.append('status_migratorio', statusMigratorioFile);

    try {
      await submitPublicDataUpdate(fd);
      setStep('success');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al enviar el formulario. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#f4f7f9' }}>
        <TopBar subtitle="Datos recibidos" />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center space-y-3 w-full max-w-sm">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">¡Datos enviados!</h2>
            <p className="text-gray-500 text-sm">
              Tus datos han sido recibidos correctamente. Gracias por actualizar tu información.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f4f7f9' }}>
      <TopBar subtitle="Formulario de Actualización de Datos" />
      <div className="max-w-md mx-auto w-full px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600 text-sm mb-5">
            Completa tus datos para mantener tu información al día. Este formulario solo puede enviarse una vez por correo electrónico.
          </p>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-none mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {lockedNpn ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                <UserCheck className="h-4 w-4 text-blue-600 flex-none" />
                <p className="text-sm text-blue-800">
                  Agente: <strong>{lockedNpn.name}</strong>
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agente / NPN *</label>
                <select name="npnName" value={form.npnName} onChange={handleChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="" disabled>Selecciona tu agente</option>
                  {NPNS.map(n => <option key={n.name} value={n.name}>{n.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aseguradora *</label>
              <select name="insurer" value={form.insurer} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="" disabled>Selecciona tu aseguradora</option>
                {INSURER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
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

            <ImagePicker label="Seguro Social" onChange={setSocialFile} />
            <ImagePicker label="Estatus Migratorio" onChange={setStatusMigratorioFile} />

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
