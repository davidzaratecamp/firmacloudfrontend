import { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { PenLine, Type } from 'lucide-react';

const FONTS = [
  { id: 'dancing',    family: 'Dancing Script', label: 'Elegante'  },
  { id: 'greatvibes', family: 'Great Vibes',    label: 'Cursiva'   },
  { id: 'caveat',     family: 'Caveat',          label: 'Natural'   },
  { id: 'pacifico',   family: 'Pacifico',        label: 'Moderna'   },
];

const DrawPad = forwardRef(function DrawPad({ onEnd, signerName = '' }, ref) {
  const canvasRef     = useRef(null);
  const fontCanvasRef = useRef(null);
  const drawing       = useRef(false);
  const lastPos       = useRef(null);

  const [empty,         setEmpty]         = useState(true);
  const [mode,          setMode]          = useState('draw');
  const [selectedFont,  setSelectedFont]  = useState(null);
  const [fontText,      setFontText]      = useState('');

  // ── Draw canvas setup ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr  = window.devicePixelRatio || 1;
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#111';
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Draw handlers ────────────────────────────────────────────────────────
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.arc(lastPos.current.x, lastPos.current.y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setEmpty(false);
  };

  const stopDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setEmpty(false);
    onEnd?.();
  };

  // ── Font rendering ───────────────────────────────────────────────────────
  const renderFont = useCallback(async (fontFamily, text) => {
    const canvas = fontCanvasRef.current;
    if (!canvas || !text) return;
    await document.fonts.load(`600 52px '${fontFamily}'`);
    const ctx = canvas.getContext('2d');
    canvas.width  = 400;
    canvas.height = 120;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font         = `600 52px '${fontFamily}'`;
    ctx.fillStyle    = '#111827';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }, []);

  const handleSelectFont = async (font) => {
    setSelectedFont(font);
    const text = fontText || signerName || 'Firma';
    await renderFont(font.family, text);
    setEmpty(false);
    onEnd?.();
  };

  const handleFontTextChange = async (e) => {
    const text = e.target.value;
    setFontText(text);
    if (selectedFont) {
      await renderFont(selectedFont.family, text || signerName || 'Firma');
      setEmpty(!text && !signerName);
    }
  };

  // Initialize fontText when signerName arrives
  useEffect(() => {
    if (!fontText && signerName) setFontText(signerName);
  }, [signerName]);

  // ── Mode switch ──────────────────────────────────────────────────────────
  const switchMode = (newMode) => {
    setMode(newMode);
    setSelectedFont(null);
    setEmpty(true);
    if (newMode === 'draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // ── Imperative handle ────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    isEmpty:   () => mode === 'font' ? !selectedFont : empty,
    clear: () => {
      setSelectedFont(null);
      setEmpty(true);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    },
    toDataURL: (type = 'image/png') =>
      mode === 'font'
        ? fontCanvasRef.current?.toDataURL(type)
        : canvasRef.current?.toDataURL(type),
  }), [mode, selectedFont, empty]);

  return (
    <div>
      {/* Mode tabs */}
      <div className="flex mb-3 bg-gray-100 rounded-lg p-1 gap-1">
        {[
          { id: 'draw', label: 'Dibujar', Icon: PenLine },
          { id: 'font', label: 'Fuente',  Icon: Type    },
        ].map(({ id, label, Icon }) => (
          <button key={id} type="button" onClick={() => switchMode(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Draw mode */}
      {mode === 'draw' && (
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          style={{ width: '100%', height: 160, touchAction: 'none', cursor: 'crosshair', display: 'block' }}
        />
      )}

      {/* Font mode */}
      {mode === 'font' && (
        <div className="space-y-3 py-1">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Texto de tu firma</label>
            <input
              type="text"
              value={fontText}
              onChange={handleFontTextChange}
              placeholder={signerName || 'Escribe tu firma...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-400">Selecciona el estilo:</p>
          <div className="grid grid-cols-2 gap-2">
            {FONTS.map(font => (
              <button key={font.id} type="button" onClick={() => handleSelectFont(font)}
                className={`p-3 border-2 rounded-xl text-left transition-all ${
                  selectedFont?.id === font.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <p className="text-[10px] text-gray-400 mb-1">{font.label}</p>
                <p style={{ fontFamily: `'${font.family}', cursive`, fontSize: 26, color: '#111827', lineHeight: 1.2 }}>
                  {fontText || signerName || 'Tu firma'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden canvas for font rendering → toDataURL */}
      <canvas ref={fontCanvasRef} style={{ display: 'none' }} />
    </div>
  );
});

export default DrawPad;
