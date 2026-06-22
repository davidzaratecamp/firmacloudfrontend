import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import DrawPad from '../components/DrawPad';
import { getSigningPage, recordView, submitSignature } from '../api/signatures';
import { CheckCircle, RotateCcw, PenLine, Loader2, AlertCircle, FileSignature, ExternalLink } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function SignPage() {
  const { token } = useParams();
  const sigCanvasRef = useRef(null);  // DrawPad ref
  const pdfUrlRef   = useRef(null);   // tracks current blob URL for cleanup

  const [pageData, setPageData]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [signerName, setSignerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [geolocation, setGeolocation] = useState(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [step, setStep]             = useState('review');
  const [pdfUrl, setPdfUrl]         = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError]     = useState(false);
  const [numPages, setNumPages]     = useState(null);
  const pdfContainerRef             = useRef(null);

  // Fetch PDF as blob to avoid cross-origin iframe restrictions
  const loadPdf = useCallback(async () => {
    setPdfLoading(true);
    setPdfError(false);
    try {
      const res = await fetch(`${API}/sign/${token}/document`);
      if (!res.ok) throw new Error('No se pudo cargar el documento');
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
      .catch(err => setError(err.response?.data?.error || 'Enlace no válido o expirado'))
      .finally(() => setLoading(false));

    return () => { if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current); };
  }, [token]);

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!signerName.trim() || !hasSignature || sigCanvasRef.current?.isEmpty()) return;
    setSubmitting(true);
    try {
      const signatureDataUrl = sigCanvasRef.current.toDataURL('image/png');
      await submitSignature(token, { signatureDataUrl, signerName: signerName.trim(), geolocation });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la firma');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !pageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace No Válido</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Documento Firmado!</h2>
          <p className="text-gray-500 mb-4">Su firma digital ha sido registrada exitosamente. Puede cerrar esta ventana.</p>
          <div className="bg-green-50 rounded-lg p-4 text-left">
            <p className="text-sm text-green-800 font-medium">Firmado por: {signerName}</p>
            <p className="text-xs text-green-600 mt-1">{new Date().toLocaleString('es-CO')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1e3a5f] text-white px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <FileSignature className="h-6 w-6 text-blue-300" />
          <div>
            <h1 className="font-bold text-lg">FirmaCloud</h1>
            <p className="text-blue-300 text-xs">Asiste Health Care</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900 font-medium">Hola, <strong>{pageData?.clientName}</strong></p>
          <p className="text-sm text-blue-700 mt-1">
            Se le ha enviado el documento <strong>{pageData?.documentName}</strong> para su revisión y firma.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[{ id: 'review', label: '1. Revisar Documento' }, { id: 'sign', label: '2. Firmar' }].map(s => (
              <button key={s.id} onClick={() => setStep(s.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${step === s.id ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                {s.label}
              </button>
            ))}
          </div>

          {step === 'review' && (
            <div className="p-4">
              {pdfLoading && (
                <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200" style={{ height: '60vh' }}>
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Cargando documento...</p>
                  </div>
                </div>
              )}

              {!pdfLoading && pdfError && (
                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200 gap-3" style={{ height: '60vh' }}>
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                  <p className="text-sm text-gray-600 text-center">No se pudo mostrar el documento en el navegador.</p>
                  <a href={`${API}/sign/${token}/document`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                    <ExternalLink className="h-4 w-4" />Abrir documento en nueva pestaña
                  </a>
                  <button onClick={() => setStep('sign')}
                    className="text-sm text-gray-500 underline hover:text-gray-700">
                    Ya lo revisé, continuar a firmar
                  </button>
                </div>
              )}

              {!pdfLoading && !pdfError && pdfUrl && (
                <div
                  ref={pdfContainerRef}
                  className="overflow-y-auto rounded-lg border border-gray-200 bg-gray-50"
                  style={{ height: '60vh' }}
                >
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    loading={
                      <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      </div>
                    }
                    error={
                      <div className="flex flex-col items-center justify-center h-40 gap-2">
                        <AlertCircle className="h-6 w-6 text-amber-500" />
                        <p className="text-sm text-gray-500">No se pudo renderizar el documento</p>
                      </div>
                    }
                  >
                    {Array.from({ length: numPages || 0 }, (_, i) => (
                      <Page
                        key={i + 1}
                        pageNumber={i + 1}
                        width={pdfContainerRef.current?.clientWidth || undefined}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="mb-1"
                      />
                    ))}
                  </Document>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                {pdfUrl && (
                  <a href={pdfUrl} download={pageData?.documentName}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" />Descargar PDF
                  </a>
                )}
                <button onClick={() => setStep('sign')}
                  className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors">
                  <PenLine className="h-4 w-4" />Proceder a Firmar
                </button>
              </div>
            </div>
          )}

          {step === 'sign' && (
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Su nombre completo *</label>
                <input value={signerName} onChange={e => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Firma manuscrita *</label>
                  <button onClick={handleClear} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />Borrar
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
                  <DrawPad ref={sigCanvasRef} onEnd={() => setHasSignature(true)} signerName={signerName} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Firme dentro del recuadro usando el dedo o el ratón</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  Al firmar, acepta que su firma digital tiene la misma validez legal que una firma manuscrita.
                </p>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}
              <button onClick={handleSubmit}
                disabled={submitting || !signerName.trim() || !hasSignature}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {submitting ? 'Procesando firma...' : 'Confirmar y Firmar Documento'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
