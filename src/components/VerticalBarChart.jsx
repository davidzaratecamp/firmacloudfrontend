// Columnas por estado (mismos datos que el donut, otro ángulo: magnitud en vez de
// proporción). Coloreado por estado (no categórico nominal) — cada barra conserva el color
// fijo de su estado, igual que el donut y las StatCard. <=24px de ancho, cuadrada en la
// base (una sola línea de base compartida), redondeada 4px en la punta.

const BAR_AREA_HEIGHT = 110;
const BAR_WIDTH = 24;

export default function VerticalBarChart({ slices, columnWidth = 60 }) {
  const max = Math.max(...slices.map(s => s.value), 1);
  const COLUMN_WIDTH = columnWidth; // ancho de la columna (etiqueta) — más ancho que la
                                     // barra para que etiquetas largas no choquen con la vecina.

  return (
    <div>
      <div className="flex items-end gap-1 border-b border-gray-200" style={{ height: BAR_AREA_HEIGHT }}>
        {slices.map(s => (
          <div key={s.key} className="flex flex-col items-center justify-end h-full" style={{ width: COLUMN_WIDTH }}>
            <span className="text-xs font-semibold text-gray-900 mb-1">{s.value}</span>
            <div
              className="rounded-t"
              style={{
                width: BAR_WIDTH,
                height: Math.max((s.value / max) * (BAR_AREA_HEIGHT - 24), s.value > 0 ? 3 : 0),
                background: s.color,
              }}
              title={`${s.label}: ${s.value}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1.5">
        {slices.map(s => (
          <span key={s.key} className="text-[10px] text-gray-500 text-center leading-tight px-0.5" style={{ width: COLUMN_WIDTH }}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
