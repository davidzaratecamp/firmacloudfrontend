// Comparación de magnitud entre categorías. Para categorías nominales sin orden (módulos)
// se pasa un solo `color` compartido -> un solo hue para todas las barras, nunca una por
// categoría (ver anti-patterns.md, "value-ramp on nominal categories"). Para un reparto por
// ESTADO, cada dato puede traer su propio `d.color` (el color de estado es fijo por
// definición, no categórico) y ese gana sobre el color compartido. Cuadrada en la base,
// 4px redondeada en la punta (el dato); el track ocupa todo el ancho disponible.

export default function BarChart({ data, color = '#3b82f6' }) {
  const max = Math.max(...data.map(d => d.value || 0), 1);

  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-40 shrink-0 text-sm text-gray-600 truncate">{d.label}</span>
          <div className="flex-1 h-5 bg-gray-100 rounded-sm overflow-hidden">
            <div
              className="h-full rounded-r"
              style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%`, background: d.color || color }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-semibold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}
