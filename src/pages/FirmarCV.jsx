import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import DrawPad from '../components/DrawPad';
import { getReclutamientoSigningPage, recordReclutamientoView, submitReclutamientoSignature } from '../api/reclutamiento';
import {
  CheckCircle, RotateCcw, ArrowRight, ArrowLeft,
  Loader2, AlertCircle, FileSignature, ExternalLink, ShieldCheck,
} from 'lucide-react';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// WhatsApp URL parser appends trailing text (e.g. " Gracias.") — extrae solo el bloque hex inicial.
function extractToken(raw) {
  const m = (raw || '').match(/^[a-f0-9]+/i);
  return m ? m[0] : raw || '';
}

const STEPS = ['tratamiento', 'sign'];
const STEP_LABELS = { tratamiento: 'Tratamiento de datos', sign: 'Firma' };

export default function FirmarCV() {
  const { token: rawToken } = useParams();
  const token = extractToken(rawToken);
  const sigCanvasRef = useRef(null);
  const pdfContainerRef = useRef(null);

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [step, setStep] = useState('tratamiento');
  const [docs, setDocs] = useState({ tratamiento: null });
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(false);
  const [numPages, setNumPages] = useState(null);

  const stepIndex = STEPS.indexOf(step);

  // pdfjs "transfiere" (detach) el buffer subyacente al cargarlo en su worker — si se vuelve a
  // montar un <Document> con el MISMO Uint8Array (ej. al volver a un paso ya visitado) falla con
  // "Failed to load PDF file". Se clona el buffer del documento activo en cada cambio de paso.
  const activeData = docs.tratamiento;
  const pdfFile = useMemo(() => (activeData ? { data: activeData.slice() } : null), [activeData, step]);

  const loadDoc = useCallback(async (tipo) => {
    setDocLoading(true);
    setDocError(false);
    try {
      const res = await fetch(`${API}/reclutamiento-sign/${token}/${tipo}`);
      if (!res.ok) throw new Error();
      const buffer = await res.arrayBuffer();
      setDocs((d) => ({ ...d, [tipo]: new Uint8Array(buffer) }));
    } catch {
      setDocError(true);
    } finally {
      setDocLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    getReclutamientoSigningPage(token)
      .then(async (r) => {
        if (cancelled) return;
        setPageData(r.data);
        recordReclutamientoView(token).catch(() => {});
        await loadDoc('tratamiento');
      })
      .catch((err) => {
        if (!cancelled) setInitError(err.response?.data?.error || 'Enlace no válido o expirado');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    setHasSignature(false);
  };

  const goToNextStep = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };
  const goToPrevStep = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const handleSubmit = async () => {
    if (!hasSignature || sigCanvasRef.current?.isEmpty()) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const signatureDataUrl = sigCanvasRef.current.toDataURL('image/png');
      const signatureMode = sigCanvasRef.current.getMode();
      await submitReclutamientoSignature(token, { signatureDataUrl, signatureMode });
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
        <p className="text-blue-200 text-sm">Cargando documentos...</p>
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
          <h2 className="text-2xl font-bold text-gray-900">¡Documentos Firmados!</h2>
          <p className="text-gray-500 text-sm">Tu firma digital quedó registrada en tu hoja de vida y en el tratamiento de datos personales.</p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <ShieldCheck className="h-4 w-4 text-gray-400" />
            <p className="text-xs text-gray-400">Puedes cerrar esta ventana</p>
          </div>
        </div>
      </div>
    );
  }

  // ── UI principal ──────────────────────────────────────────────────────────

  const isDocStep = step === 'tratamiento';
  const nextLabel = 'Proceder a firmar';

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">

      {/* Header fijo */}
      <header className="flex-none bg-[#1e3a5f] px-4 flex items-center justify-between" style={{ height: 56 }}>
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <button onClick={goToPrevStep} className="text-blue-300 hover:text-white transition-colors mr-1 p-1">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <FileSignature className="h-5 w-5 text-blue-300" />
          <div>
            <span className="text-white font-bold text-sm">Asiste ING</span>
            <span className="text-blue-400 text-xs ml-2">Reclutamiento y Selección</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-2 rounded-full transition-all duration-300 ${i === stepIndex ? 'w-5 bg-white' : 'w-2 bg-blue-800'}`} />
          ))}
        </div>
      </header>

      {/* ── PASO: Tratamiento de datos ── */}
      {isDocStep && (
        <>
          <div className="flex-none bg-blue-600 px-4 py-2.5 flex items-center justify-between">
            <p className="text-blue-100 text-xs truncate max-w-[260px]">
              {pageData?.candidateName} — {STEP_LABELS[step]}
            </p>
            <span className="text-xs text-blue-200 bg-blue-700 rounded-full px-2 py-0.5">Paso {stepIndex + 1} de {STEPS.length}</span>
          </div>

          <div ref={pdfContainerRef} className="flex-1 overflow-y-auto bg-gray-200">
            {docLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500">Cargando documento...</p>
              </div>
            )}

            {!docLoading && docError && (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
                <AlertCircle className="h-10 w-10 text-amber-500" />
                <p className="text-sm text-gray-600 text-center">No se pudo mostrar el documento.</p>
                <a
                  href={`${API}/reclutamiento-sign/${token}/${step}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
                  onClick={() => loadDoc(step)}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en nueva pestaña
                </a>
              </div>
            )}

            {!docLoading && !docError && activeData && (
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
            {activeData && (
              <a
                href={`${API}/reclutamiento-sign/${token}/${step}`}
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
              disabled={docLoading || docError}
              className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {nextLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* ── PASO: Firma ── */}
      {step === 'sign' && (
        <>
          <div className="flex-none bg-blue-600 px-4 py-2.5 flex items-center justify-between">
            <p className="text-blue-100 text-xs">Firma una sola vez — se aplicará en tu hoja de vida y en el tratamiento de datos</p>
            <span className="text-xs text-blue-200 bg-blue-700 rounded-full px-2 py-0.5">Paso {stepIndex + 1} de {STEPS.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
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
                Firma con el dedo o con el ratón dentro del recuadro
              </p>
            </div>

            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <ShieldCheck className="h-4 w-4 text-amber-500 flex-none mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Al firmar, aceptas que tu firma digital tiene la misma validez legal que una firma manuscrita, que
                leíste el tratamiento de datos personales completo y que la información de tu hoja de vida es correcta.
              </p>
            </div>

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
              disabled={submitting || !hasSignature}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
                hasSignature && !submitting
                  ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" />Procesando...</>
                : <><CheckCircle className="h-4 w-4" />Confirmar y Firmar</>
              }
            </button>
          </div>
        </>
      )}
    </div>
  );
}
