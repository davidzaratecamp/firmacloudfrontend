import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import DrawPad from '../components/DrawPad';
import { getSigningPage, recordView, submitSignature } from '../api/signatures';
import {
  CheckCircle, RotateCcw, ArrowRight, ArrowLeft,
  Loader2, AlertCircle, FileSignature, ExternalLink, ShieldCheck,
} from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function SignPage() {
  const { token } = useParams();
  const sigCanvasRef    = useRef(null);
  const pdfUrlRef       = useRef(null);
  const pdfContainerRef = useRef(null);

  const [pageData, setPageData]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [initError, setInitError]     = useState('');
  const [submitError, setSubmitError] = useState('');
  const [signerName, setSignerName]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState(false);
  const [geolocation, setGeolocation] = useState(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [ersdAccepted, setErsdAccepted] = useState(false);
  const [showErsd, setShowErsd]         = useState(false);
  const [step, setStep]               = useState('document');
  const [pdfUrl, setPdfUrl]           = useState(null);
  const [pdfLoading, setPdfLoading]   = useState(false);
  const [pdfError, setPdfError]       = useState(false);
  const [numPages, setNumPages]       = useState(null);

  const loadPdf = useCallback(async () => {
    setPdfLoading(true);
    setPdfError(false);
    try {
      const res = await fetch(`${API}/sign/${token}/document`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
      const url = URL.createObjectURL(blob);
      pdfUrlRef.current = url;
      setPdfUrl(url);
    } catch {
      setPdfError(true);
    } finally {
      setPdfLoading(false);
    }
  }, [token]);

  useEffect(() => {
    getSigningPage(token)
      .then(r => {
        setPageData(r.data);
        setSignerName(r.data.clientName);
        recordView(token).catch(() => {});
        loadPdf();
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async pos => {
              const geo = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              };
              try {
                const r = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${geo.latitude}&longitude=${geo.longitude}&localityLanguage=es`
                );
                const data = await r.json();
                const parts = [data.city || data.locality, data.principalSubdivision, data.countryName].filter(Boolean);
                if (parts.length) geo.locationName = parts.join(', ');
              } catch {}
              setGeolocation(geo);
            },
            () => {}
          );
        }
      })
      .catch(err => setInitError(err.response?.data?.error || 'Enlace no válido o expirado'))
      .finally(() => setLoading(false));

    return () => { if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current); };
  }, [token]);

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!signerName.trim() || !hasSignature || sigCanvasRef.current?.isEmpty()) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const signatureDataUrl = sigCanvasRef.current.toDataURL('image/png');
      await submitSignature(token, { signatureDataUrl, signerName: signerName.trim(), geolocation, ersdAccepted: true });
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
          <h2 className="text-2xl font-bold text-gray-900">¡Documento Firmado!</h2>
          <p className="text-gray-500 text-sm">Su firma digital ha sido registrada exitosamente.</p>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-left space-y-1">
            <p className="text-sm font-semibold text-green-800">Firmado por: {signerName}</p>
            <p className="text-xs text-green-600">{new Date().toLocaleString('es-CO')}</p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <ShieldCheck className="h-4 w-4 text-gray-400" />
            <p className="text-xs text-gray-400">Puede cerrar esta ventana</p>
          </div>
        </div>
      </div>
    );
  }

  // ── UI principal ──────────────────────────────────────────────────────────

  const canSubmit = signerName.trim() && hasSignature && ersdAccepted;

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">

      {/* Header fijo */}
      <header className="flex-none bg-[#1e3a5f] px-4 flex items-center justify-between" style={{ height: 56 }}>
        <div className="flex items-center gap-2">
          {step === 'sign' && (
            <button
              onClick={() => setStep('document')}
              className="text-blue-300 hover:text-white transition-colors mr-1 p-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <FileSignature className="h-5 w-5 text-blue-300" />
          <div>
            <span className="text-white font-bold text-sm">Asiste Health Care</span>
            <span className="text-blue-400 text-xs ml-2">Firma Digital</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 rounded-full transition-all duration-300 ${step === 'document' ? 'w-5 bg-white' : 'w-2 bg-blue-500'}`} />
          <div className={`h-2 rounded-full transition-all duration-300 ${step === 'sign' ? 'w-5 bg-white' : 'w-2 bg-blue-800'}`} />
        </div>
      </header>

      {/* ── PASO 1: Documento ── */}
      {step === 'document' && (
        <>
          {/* Banda de info del cliente */}
          <div className="flex-none bg-blue-600 px-4 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-medium">{pageData?.clientName}</p>
              <p className="text-blue-200 text-xs truncate max-w-[220px]">{pageData?.documentName}</p>
            </div>
            <span className="text-xs text-blue-200 bg-blue-700 rounded-full px-2 py-0.5">Paso 1 de 2</span>
          </div>

          {/* Área del PDF — ocupa todo el espacio disponible */}
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
                  href={`${API}/sign/${token}/document`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en nueva pestaña
                </a>
              </div>
            )}

            {!pdfLoading && !pdfError && pdfUrl && (
              <Document
                file={pdfUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
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
                    renderAnnotationLayer={false}
                  />
                ))}
              </Document>
            )}
          </div>

          {/* Footer fijo — botón de continuar */}
          <div className="flex-none bg-white border-t border-gray-200 px-4 flex items-center justify-between" style={{ height: 64 }}>
            {pdfUrl && (
              <a
                href={pdfUrl}
                download={pageData?.documentName}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Descargar
              </a>
            )}
            <button
              onClick={() => setStep('sign')}
              className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Proceder a firmar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* ── PASO 2: Firma ── */}
      {step === 'sign' && (
        <>
          {/* Banda de info */}
          <div className="flex-none bg-blue-600 px-4 py-2.5 flex items-center justify-between">
            <p className="text-blue-100 text-xs">Firmando como <span className="font-semibold text-white">{pageData?.clientName}</span></p>
            <span className="text-xs text-blue-200 bg-blue-700 rounded-full px-2 py-0.5">Paso 2 de 2</span>
          </div>

          {/* Contenido scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

            {/* Nombre */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Nombre completo *
              </label>
              <input
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="Como aparece en su documento de identidad"
                className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

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
                <DrawPad ref={sigCanvasRef} onEnd={() => setHasSignature(true)} signerName={signerName} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 text-center">
                Firme con el dedo o con el ratón dentro del recuadro
              </p>
            </div>

            {/* Aviso legal */}
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <ShieldCheck className="h-4 w-4 text-amber-500 flex-none mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Al firmar, acepta que su firma digital tiene la misma validez legal que una firma manuscrita y que ha leído el documento.
              </p>
            </div>

            {/* ERSD Acceptance */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-start gap-3 p-3.5 bg-white">
                <input
                  type="checkbox"
                  id="ersd"
                  checked={ersdAccepted}
                  onChange={e => setErsdAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-blue-600 flex-none cursor-pointer"
                />
                <label htmlFor="ersd" className="text-xs text-gray-700 leading-relaxed cursor-pointer">
                  <span className="font-semibold">I agree to use electronic records and signatures.</span>{' '}
                  I have reviewed and accept the{' '}
                  <button
                    type="button"
                    onClick={() => setShowErsd(v => !v)}
                    className="text-blue-600 underline"
                  >
                    Electronic Record and Signature Disclosure
                  </button>
                  {' '}and consent to sign documents electronically.
                </label>
              </div>
              {showErsd && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 max-h-44 overflow-y-auto text-xs text-gray-600 space-y-2.5">
                  <p className="font-semibold text-gray-800">ELECTRONIC RECORD AND SIGNATURE DISCLOSURE — Asiste Health Care</p>
                  <p>Asiste Health Care may be required by law to provide you certain written notices or disclosures electronically through the Asiste Health Care system.</p>
                  <p><span className="font-medium">Getting paper copies:</span> At any time, you may request a paper copy of any record provided electronically by contacting admin@asistehealth.com.</p>
                  <p><span className="font-medium">Withdrawing your consent:</span> You may at any time request to receive notices in paper format by emailing admin@asistehealth.com with your full name, email, and mailing address.</p>
                  <p><span className="font-medium">Legal effect:</span> Your electronic signature has the same legal effect as a handwritten signature under the U.S. Electronic Signatures in Global and National Commerce Act (E-SIGN Act) and the Uniform Electronic Transactions Act (UETA).</p>
                  <p><span className="font-medium">Contact:</span> admin@asistehealth.com</p>
                </div>
              )}
            </div>

            {/* Error de envío */}
            {submitError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 text-red-500 flex-none mt-0.5" />
                <p className="text-xs text-red-700">{submitError}</p>
              </div>
            )}
          </div>

          {/* Footer fijo — botón de firmar */}
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
                : <><CheckCircle className="h-4 w-4" />Confirmar y Firmar Documento</>
              }
            </button>
          </div>
        </>
      )}
    </div>
  );
}
