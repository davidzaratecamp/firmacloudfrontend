import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import BarChart from '../components/BarChart';
import VerticalBarChart from '../components/VerticalBarChart';
import { useAuth } from '../context/AuthContext';
import { dashboardModulesForRole } from '../utils/roles';
import { getDashboard as getFirmasDashboard } from '../api/signatures';
import { getCartasDashboard } from '../api/cartas';
import { getOleadasDashboard } from '../api/oleadas';
import { getPublicDataUpdatesDashboard } from '../api/publicDataUpdate';
import { getContractsDashboard } from '../api/hrContracts';
import { getCandidatosDashboard } from '../api/reclutamiento';
import { getBeemoStats } from '../api/beemo';
import { FileText, Clock, AlertCircle, Layers, Briefcase, GraduationCap, ClipboardCheck } from 'lucide-react';

// Colores de estado fijos, coherentes con las clases Tailwind bg-yellow-500/bg-blue-500/
// bg-green-500/bg-red-500 usadas en las StatCard de abajo — las columnas de VerticalBarChart
// nunca inventan una paleta nueva, pintan con los mismos colores por estado.
const STATUS_COLOR = {
  pending: '#eab308', viewed: '#3b82f6', signed: '#22c55e', expired: '#9ca3af', failed: '#ef4444',
  active: '#22c55e', paused: '#eab308', completed: '#3b82f6', cancelled: '#9ca3af',
};
const STATUS_LABEL = {
  pending: 'Pendiente', viewed: 'Visto', signed: 'Firmado', expired: 'Expirado', failed: 'Fallido',
  active: 'Activa', paused: 'Pausada', completed: 'Completada', cancelled: 'Cancelada',
};
function slicesFromStats(stats, keys) {
  return keys.map(key => ({ key, label: STATUS_LABEL[key], value: stats?.[key] || 0, color: STATUS_COLOR[key] }));
}

// Una entrada por clave de src/utils/roles.js#dashboardModulesForRole. Cada `fetch` pega a
// un endpoint /dashboard (o /stats) ya scoped por rol/agente en el backend; `toCards`
// normaliza esa respuesta (la forma difiere por módulo) a lo que pinta ModuleSection.
// `toSlices` es opcional: solo los módulos cuyo total se reparte limpio en un estado (una
// partición real, sin traslapes) tienen columnas por estado — Actualizaciones públicas no
// tiene, por ejemplo. Las StatCard que quedan son solo las que NO repiten un número que ya
// muestra el gráfico de columnas (p.ej. "Total", o "Destinatarios"/"Fallidos" en Oleadas,
// que son otra unidad — conteo de destinatarios, no de oleadas).
const MODULE_CONFIG = {
  firmas: {
    title: 'Firmas',
    summaryLabel: 'Tratamiento datos Obama',
    listTo: '/firmas',
    fetch: getFirmasDashboard,
    toCards: (d) => [
      { label: 'Total', value: d.stats?.total, icon: FileText, color: 'bg-blue-500' },
    ],
    toSlices: (d) => slicesFromStats(d.stats, ['pending', 'viewed', 'signed', 'expired']),
  },
  cartas: {
    title: 'Cartas',
    summaryLabel: 'Actualizacion informacion Obama',
    listTo: '/cartas',
    fetch: getCartasDashboard,
    toCards: (d) => [
      { label: 'Total', value: d.stats?.total, icon: FileText, color: 'bg-blue-500' },
    ],
    toSlices: (d) => slicesFromStats(d.stats, ['pending', 'viewed', 'signed', 'expired', 'failed']),
  },
  oleadas: {
    title: 'Oleadas',
    listTo: '/oleadas',
    fetch: getOleadasDashboard,
    toCards: (d) => [
      { label: 'Total', value: d.stats?.total, icon: Layers, color: 'bg-blue-500' },
      { label: 'Destinatarios', value: d.stats?.total_recipients, icon: FileText, color: 'bg-violet-500' },
      { label: 'Fallidos', value: d.stats?.failed_count, icon: AlertCircle, color: 'bg-red-500' },
    ],
    // Reparto por estado de la OLEADA (activa/pausada/completada/cancelada) — no de los
    // destinatarios, que son otra unidad y ya se ven en las tarjetas de arriba.
    toSlices: (d) => slicesFromStats(d.stats, ['active', 'paused', 'completed', 'cancelled']),
  },
  actualizaciones: {
    title: 'Actualizaciones públicas',
    listTo: '/actualizaciones-publicas',
    fetch: getPublicDataUpdatesDashboard,
    toCards: (d) => [
      { label: 'Total', value: d.stats?.total, icon: ClipboardCheck, color: 'bg-blue-500' },
      { label: 'Últimos 30 días', value: d.stats?.last30days, icon: Clock, color: 'bg-violet-500' },
    ],
  },
  rrhh: {
    title: 'RRHH · Contratos',
    listTo: '/rrhh/contratos',
    fetch: getContractsDashboard,
    toCards: (d) => [
      { label: 'Total', value: d.stats?.total, icon: Briefcase, color: 'bg-blue-500' },
    ],
    toSlices: (d) => slicesFromStats(d.stats, ['pending', 'viewed', 'signed']),
  },
  reclutamiento: {
    title: 'Reclutamiento',
    listTo: '/reclutamiento/candidatos',
    fetch: getCandidatosDashboard,
    toCards: (d) => [
      { label: 'Total', value: d.stats?.total, icon: GraduationCap, color: 'bg-blue-500' },
    ],
    toSlices: (d) => slicesFromStats(d.stats, ['pending', 'viewed', 'signed']),
  },
  beemo: {
    title: 'Beemo',
    listTo: '/beemo/documentos',
    fetch: getBeemoStats,
    toCards: () => [],
    toSlices: (d) => slicesFromStats(d.counts, ['pending', 'viewed', 'signed']),
  },
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-glow transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${color}`}><Icon className="h-4 w-4 text-white" /></div>
      </div>
      <p className="text-3xl font-bold font-display text-gray-900">{value ?? 0}</p>
    </div>
  );
}

function ModuleSection({ config, result, delay }) {
  const { title, listTo } = config;
  const cards = result?.data ? config.toCards(result.data) : [];
  const slices = result?.data && config.toSlices ? config.toSlices(result.data) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold font-display text-gray-900">{title}</h2>
        <Link to={listTo} className="text-accent-600 text-sm hover:underline">Ver todo</Link>
      </div>

      {result?.error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          No se pudo cargar la información de {title}.
        </div>
      ) : (
        <>
          {cards.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-4">
              {cards.map(c => <div key={c.label} className="w-44"><StatCard {...c} /></div>)}
            </div>
          )}
          {slices && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
              <BarChart data={slices.map(s => ({ label: s.label, value: s.value, color: s.color }))} />
            </div>
          )}
        </>
      )}
    </motion.section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const moduleKeys = user ? dashboardModulesForRole(user.role) : [];
  const [results, setResults] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const keys = dashboardModulesForRole(user.role);

    Promise.allSettled(keys.map(key => MODULE_CONFIG[key].fetch()))
      .then((settled) => {
        if (cancelled) return;
        const next = {};
        settled.forEach((res, i) => {
          next[keys[i]] = res.status === 'fulfilled' ? { data: res.value.data, error: false } : { data: null, error: true };
        });
        setResults(next);
        setLoaded(true);
      });

    return () => { cancelled = true; };
  }, [user]);

  return (
    <Layout>
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-2xl font-bold font-display text-gray-900 mb-6"
      >
        Dashboard
      </motion.h1>

      {!loaded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-[104px] animate-pulse" />
          ))}
        </div>
      )}

      {loaded && (() => {
        // "Total" por módulo ya viene en cada respuesta (primera StatCard) — el resumen
        // general no pide nada nuevo, solo compara lo que cada sección ya muestra por separado.
        const totals = moduleKeys
          .filter(key => results[key]?.data && !results[key]?.error)
          .map(key => ({
            key,
            label: MODULE_CONFIG[key].summaryLabel || MODULE_CONFIG[key].title,
            value: MODULE_CONFIG[key].toCards(results[key].data).find(c => c.label === 'Total')?.value || 0,
            color: '#3b82f6', // categórico nominal de una sola serie: mismo hue para todos los módulos
          }));
        if (totals.length < 2) return null;
        return (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mb-8 bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-semibold font-display text-gray-900 mb-4">Resumen general</h2>
            <VerticalBarChart slices={totals} columnWidth={84} />
          </motion.section>
        );
      })()}

      {loaded && moduleKeys.map((key, i) => (
        <ModuleSection key={key} config={MODULE_CONFIG[key]} result={results[key]} delay={i * 0.05} />
      ))}

      {loaded && moduleKeys.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-12">No hay módulos disponibles para tu rol.</p>
      )}
    </Layout>
  );
}
