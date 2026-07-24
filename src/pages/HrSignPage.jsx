import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import DrawPad from '../components/DrawPad';
import { getHrSigningPage, recordHrView, submitHrSignature } from '../api/hrContracts';
import {
  CheckCircle, RotateCcw, ArrowRight, ArrowLeft,
  Loader2, AlertCircle, FileSignature, ExternalLink, ShieldCheck, Pencil,
} from 'lucide-react';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Tamaño de página de la plantilla de contrato laboral (612x792pt, carta EE.UU.) — se usa para
// convertir las coordenadas PDF (origen inferior-izquierdo) a posición en pantalla (origen
// superior-izquierdo) de los campos editables superpuestos sobre la página renderizada.
const PAGE_POINTS_WIDTH = 612;
const PAGE_POINTS_HEIGHT = 792;

// WhatsApp URL parser appends trailing text (e.g. " Gracias.") — extract only the leading hex block.
function extractToken(raw) {
  const m = (raw || '').match(/^[a-f0-9]+/i);
  return m ? m[0] : raw || '';
}

// Input de texto superpuesto sobre la página del PDF renderizada, posicionado a partir de las
// coordenadas (en puntos PDF) detectadas en el backend para ese campo.
function FieldOverlayInput({ field, scale, value, onChange, placeholder }) {
  if (!field || !scale) return null;
  const left = field.x * scale;
  const top = (PAGE_POINTS_HEIGHT - field.y - field.height) * scale;
  const width = Math.max(field.width * scale, 60);
  const height = Math.max(field.height * scale, 22);

  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ position: 'absolute', left, top, width, height, fontSize: Math.max(height * 0.55, 11) }}
      className="border-2 border-blue-500 bg-blue-50/80 rounded px-1.5 text-gray-900 font-medium
                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white shadow-sm"
    />
  );
}

export default function HrSignPage() {
  const { token: rawToken } = useParams();
  const token = extractToken(rawToken);
  const sigCanvasRef      = useRef(null);
  const pdfContainerRef   = useRef(null);
  const prefillContainerRef = useRef(null);

  const [pageData, setPageData]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [initError, setInitError]       = useState('');
  const [submitError, setSubmitError]   = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [success, setSuccess]           = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [step, setStep]                 = useState('document');
  const [pdfData, setPdfData]           = useState(null);
  const [pdfLoading, setPdfLoading]     = useState(false);
  const [pdfError, setPdfError]         = useState(false);
  const [numPages, setNumPages]         = useState(null);
  const [prefillWidth, setPrefillWidth] = useState(0);
  const [fillInValues, setFillInValues] = useState({
    entidadAfiliacion: '', tallaCamisa: '', tallaPantalon: '', tallaCalzado: '',
  });

  // pdfjs "transfiere" (detach) el buffer subyacente al cargarlo en su worker, así que un
  // <Document> nuevo con el MISMO Uint8Array falla con "Failed to load PDF file" — pasa al
  // navegar del paso 'document' a 'prefill8'/'prefill9' (cada uno monta su propio <Document>).
  // Se clona el buffer cada vez que cambia de paso para que cada montaje tenga su propia copia.
  const pdfFile = useMemo(() => (pdfData ? { data: pdfData.slice() } : null), [pdfData, step]);
  const fillInFields = pageData?.fillInFields || {};
  const hasPage8Fields = !!fillInFields.entidadAfiliacion;
  const hasPage9Fields = !!(fillInFields.tallaCamisa || fillInFields.tallaPantalon || fillInFields.tallaCalzado);

  // Secuencia de pasos dinámica: se omite un paso de pre-llenado si el documento no trae ese
  // campo detectable (ej. una plantilla distinta sin tabla de tallas).
  const steps = useMemo(() => {
    const s = ['document'];
    if (hasPage8Fields) s.push('prefill8');
    if (hasPage9Fields) s.push('prefill9');
    s.push('sign');
    return s;
  }, [hasPage8Fields, hasPage9Fields]);
  const stepIndex = steps.indexOf(step);

  // Solo se usa en el botón de reintento del error UI
  const loadPdf = useCallback(async () => {
    setPdfLoading(true);
    setPdfError(false);
    try {
      const res = await fetch(`${API}/rrhh-sign/${token}/document`);
      if (!res.ok) throw new Error();
      const buffer = await res.arrayBuffer();
      setPdfData(new Uint8Array(buffer));
    } catch {
      setPdfError(true);
    } finally {
      setPdfLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // 'cancelled' evita que el resultado de la primera invocación (StrictMode)
    // actualice el estado cuando el effect se desmonta y remonta.
    let cancelled = false;

    getHrSigningPage(token)
      .then(async r => {
        if (cancelled) return;
        setPageData(r.data);
        recordHrView(token).catch(() => {});

        setPdfLoading(true);
        try {
          const res = await fetch(`${API}/rrhh-sign/${token}/document`);
          if (!res.ok) throw new Error();
          const buffer = await res.arrayBuffer();
          if (!cancelled) setPdfData(new Uint8Array(buffer));
        } catch {
          if (!cancelled) setPdfError(true);
        } finally {
          if (!cancelled) setPdfLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) setInitError(err.response?.data?.error || 'Enlace no válido o expirado');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token]);

  // Mide el ancho del contenedor de las pantallas de pre-llenado al entrar a esos pasos, para
  // calcular la escala PDF→pantalla de los campos superpuestos.
  useEffect(() => {
    if ((step === 'prefill8' || step === 'prefill9') && prefillContainerRef.current) {
      setPrefillWidth(prefillContainerRef.current.clientWidth);
    }
  }, [step]);

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    setHasSignature(false);
  };

  const setFieldValue = (key, value) => setFillInValues(v => ({ ...v, [key]: value }));

  const canContinuePage8 = !hasPage8Fields || fillInValues.entidadAfiliacion.trim();
  const canContinuePage9 = ['tallaCamisa', 'tallaPantalon', 'tallaCalzado']
    .every(k => !fillInFields[k] || fillInValues[k].trim());

  const goToNextStep = () => {
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  };
  const goToPrevStep = () => {
    const prev = steps[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const handleSubmit = async () => {
    if (!hasSignature || sigCanvasRef.current?.isEmpty()) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const signatureDataUrl = sigCanvasRef.current.toDataURL('image/png');
      const signatureMode = sigCanvasRef.current.getMode();
      await submitHrSignature(token, { signatureDataUrl, signatureMode, ...fillInValues });
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Error al enviar la firma. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Pantallas de estado ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#1e3a5f] gap-4">
        <FileSignature className="h-10 w-10 text-blue-300" />
        <Loader2 className="h-6 w-6 animate-spin text-white" />
        <p className="text-blue-200 text-sm">Cargando documento...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Enlace no válido</h2>
          <p className="text-sm text-gray-500">{initError}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white p-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">¡Contrato Firmado!</h2>
          <p className="text-gray-500 text-sm">Su firma digital ha sido registrada exitosamente en todas las hojas correspondientes.</p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <ShieldCheck className="h-4 w-4 text-gray-400" />
            <p className="text-xs text-gray-400">Puede cerrar esta ventana</p>
          </div>
        </div>
      </div>
    );
  }

  // ── UI principal ──────────────────────────────────────────────────────────

  const canSubmit = hasSignature;
  const prefillScale = prefillWidth ? prefillWidth / PAGE_POINTS_WIDTH : 0;

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">

      {/* Header fijo */}
      <header className="flex-none bg-[#1e3a5f] px-4 flex items-center justify-between" style={{ height: 56 }}>
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <button
              onClick={goToPrevStep}
              className="text-blue-300 hover:text-white transition-colors mr-1 p-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <FileSignature className="h-5 w-5 text-blue-300" />
          <div>
            <span className="text-white font-bold text-sm">Asiste Health Care</span>
            <span className="text-blue-400 text-xs ml-2">Recursos Humanos</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <div key={s} className={`h-2 rounded-full transition-all duration-300 ${i === stepIndex ? 'w-5 bg-white' : 'w-2 bg-blue-800'}`} />
          ))}
        </div>
      </header>

      {/* ── PASO: Documento ── */}
      {step === 'document' && (
        <>
          <div className="flex-none bg-blue-600 px-4 py-2.5 flex items-center justify-between">
            <p className="text-blue-100 text-xs truncate max-w-[260px]">{pageData?.documentName}</p>
            <span className="text-xs text-blue-200 bg-blue-700 rounded-full px-2 py-0.5">Paso {stepIndex + 1} de {steps.length}</span>
          </div>

          <div ref={pdfContainerRef} className="flex-1 overflow-y-auto bg-gray-200">
            {pdfLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500">Cargando documento...</p>
              </div>
            )}

            {!pdfLoading && pdfError && (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
                <AlertCircle className="h-10 w-10 text-amber-500" />
                <p className="text-sm text-gray-600 text-center">No se pudo mostrar el documento.</p>
                <a
                  href={`${API}/rrhh-sign/${token}/document`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
                  onClick={loadPdf}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en nueva pestaña
                </a>
              </div>
            )}

            {!pdfLoading && !pdfError && pdfData && (
              <Document
                file={pdfFile}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={(err) => console.error('[react-pdf] load error:', err)}
                loading={
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <AlertCircle className="h-7 w-7 text-red-400" />
                    <p className="text-sm text-gray-500">Error al renderizar el PDF</p>
                  </div>
                }
              >
                {Array.from({ length: numPages || 0 }, (_, i) => (
                  <Page
                    key={i + 1}
                    pageNumber={i + 1}
                    width={pdfContainerRef.current?.clientWidth || window.innerWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={true}
                  />
                ))}
              </Document>
            )}
          </div>

          <div className="flex-none bg-white border-t border-gray-200 px-4 flex items-center justify-between" style={{ height: 64 }}>
            {pdfData && (
              <a
                href={`${API}/rrhh-sign/${token}/document`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Descargar
              </a>
            )}
            <button
              onClick={goToNextStep}
              className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Proceder a firmar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* ── PASO: Entidad de afiliación (página con el campo detectado) ── */}
      {step === 'prefill8' && (
        <>
          <div className="flex-none bg-amber-500 px-4 py-2.5">
            <p className="text-white text-xs font-medium flex items-center gap-1.5">
              <Pencil className="h-3.5 w-3.5 flex-none" />
              Escribe el nombre de la entidad de afiliación en el campo resaltado
            </p>
          </div>

          <div ref={prefillContainerRef} className="flex-1 overflow-y-auto bg-gray-200 relative">
            {pdfFile && (
              <div className="relative inline-block w-full">
                <Document file={pdfFile} loading={
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                  </div>
                }>
                  <Page
                    pageNumber={fillInFields.entidadAfiliacion.page + 1}
                    width={prefillContainerRef.current?.clientWidth || window.innerWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
                <FieldOverlayInput
                  field={fillInFields.entidadAfiliacion}
                  scale={prefillScale}
                  value={fillInValues.entidadAfiliacion}
                  onChange={v => setFieldValue('entidadAfiliacion', v)}
                  placeholder="Nombre de la entidad"
                />
              </div>
            )}
          </div>

          <div className="flex-none bg-white border-t border-gray-200 px-4 flex items-center" style={{ height: 64 }}>
            <button
              onClick={goToNextStep}
              disabled={!canContinuePage8}
              className={`ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                canContinuePage8 ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* ── PASO: Tabla de tallas (página con los 3 campos detectados) ── */}
      {step === 'prefill9' && (
        <>
          <div className="flex-none bg-amber-500 px-4 py-2.5">
            <p className="text-white text-xs font-medium flex items-center gap-1.5">
              <Pencil className="h-3.5 w-3.5 flex-none" />
              Completa tu talla de camisa, pantalón y calzado en la tabla resaltada
            </p>
          </div>

          <div ref={prefillContainerRef} className="flex-1 overflow-y-auto bg-gray-200 relative">
            {pdfFile && (
              <div className="relative inline-block w-full">
                <Document file={pdfFile} loading={
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                  </div>
                }>
                  <Page
                    pageNumber={(fillInFields.tallaCamisa || fillInFields.tallaPantalon || fillInFields.tallaCalzado).page + 1}
                    width={prefillContainerRef.current?.clientWidth || window.innerWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
                <FieldOverlayInput field={fillInFields.tallaCamisa} scale={prefillScale}
                  value={fillInValues.tallaCamisa} onChange={v => setFieldValue('tallaCamisa', v)} placeholder="Talla" />
                <FieldOverlayInput field={fillInFields.tallaPantalon} scale={prefillScale}
                  value={fillInValues.tallaPantalon} onChange={v => setFieldValue('tallaPantalon', v)} placeholder="Talla" />
                <FieldOverlayInput field={fillInFields.tallaCalzado} scale={prefillScale}
                  value={fillInValues.tallaCalzado} onChange={v => setFieldValue('tallaCalzado', v)} placeholder="Talla" />
              </div>
            )}
          </div>

          <div className="flex-none bg-white border-t border-gray-200 px-4 flex items-center" style={{ height: 64 }}>
            <button
              onClick={goToNextStep}
              disabled={!canContinuePage9}
              className={`ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                canContinuePage9 ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* ── PASO: Firma ── */}
      {step === 'sign' && (
        <>
          <div className="flex-none bg-blue-600 px-4 py-2.5 flex items-center justify-between">
            <p className="text-blue-100 text-xs">Firme una sola vez — se aplicará en todas las hojas del contrato</p>
            <span className="text-xs text-blue-200 bg-blue-700 rounded-full px-2 py-0.5">Paso {stepIndex + 1} de {steps.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

            {/* Pad de firma */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Firma manuscrita *
                </label>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Borrar
                </button>
              </div>
              <div className={`rounded-xl overflow-hidden border-2 transition-colors ${hasSignature ? 'border-blue-400' : 'border-dashed border-gray-300'} bg-white`}>
                <DrawPad ref={sigCanvasRef} onEnd={() => setHasSignature(true)} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 text-center">
                Firme con el dedo o con el ratón dentro del recuadro
              </p>
            </div>

            {/* Aviso legal */}
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <ShieldCheck className="h-4 w-4 text-amber-500 flex-none mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Al firmar, acepta que su firma digital tiene la misma validez legal que una firma manuscrita y que ha leído el contrato completo.
              </p>
            </div>

            {/* Error de envío */}
            {submitError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 text-red-500 flex-none mt-0.5" />
                <p className="text-xs text-red-700">{submitError}</p>
              </div>
            )}
          </div>

          <div className="flex-none bg-white border-t border-gray-200 px-4" style={{ height: 72, display: 'flex', alignItems: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
                canSubmit && !submitting
                  ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" />Procesando...</>
                : <><CheckCircle className="h-4 w-4" />Confirmar y Firmar Contrato</>
              }
            </button>
          </div>
        </>
      )}
    </div>
  );
}
