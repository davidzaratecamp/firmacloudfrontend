import { useEffect, useState, useCallback } from 'react';
import { listPublicDataUpdates, getPublicDataUpdatePhotoUrl } from '../api/publicDataUpdate';
import { NPNS, slugifyNpn } from '../constants/npns';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { Search, User, Image as ImageIcon, RefreshCw, Copy, Check, ChevronDown, ChevronUp, Link2 } from 'lucide-react';

const LIMIT = 20;

const INSURER_OPTIONS = ['', 'oscar', 'ambetter'];
const INSURER_LABELS  = {
  '':       'Todas',
  oscar:    'Oscar',
  ambetter: 'Ambetter',
};
const INSURER_BADGE = {
  oscar:    'bg-slate-100 text-slate-700',
  ambetter: 'bg-purple-100 text-purple-700',
};

function NpnLinksPanel() {
  const [open, setOpen] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const links = NPNS.map(n => ({
    name: n.name,
    url: `${window.location.origin}/actualizar-datos/${slugifyNpn(n.name)}`,
  }));

  const copyOne = async (slug, url) => {
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1500);
  };

  const copyAll = async () => {
    const text = links.map(l => `${l.name}: ${l.url}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Link2 className="h-4 w-4 text-blue-600" /> Links públicos por NPN ({links.length})
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && (
        <div className="border-t border-gray-100">
          <div className="p-4 flex justify-end">
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              {copiedAll ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedAll ? 'Copiado' : 'Copiar todos'}
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {links.map(l => {
              const slug = slugifyNpn(l.name);
              return (
                <div key={slug} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{l.name}</p>
                    <p className="text-xs text-gray-500 truncate">{l.url}</p>
                  </div>
                  <button
                    onClick={() => copyOne(slug, l.url)}
                    className="flex-none flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    {copiedSlug === slug ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedSlug === slug ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicDataUpdateList() {
  const [data, setData]     = useState({ data: [], total: 0 });
  const [search, setSearch] = useState('');
  const [insurer, setInsurer] = useState('');
  const [page, setPage]     = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [photoModal, setPhotoModal] = useState(null); // { url, title }

  const load = useCallback(() => {
    return listPublicDataUpdates({ search, insurer, page, limit: LIMIT }).then(r => setData(r.data));
  }, [search, insurer, page]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  const openPhoto = async (id, type, title) => {
    const url = await getPublicDataUpdatePhotoUrl(id, type);
    setPhotoModal({ url, title });
  };

  const totalPages = Math.ceil(data.total / LIMIT);

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Actualizaciones de Datos (Enlace Público)</h1>
      <p className="text-sm text-gray-500 mb-6">
        Registros enviados a través del formulario público de actualización de datos — no ligados a una carta específica.
      </p>

      <NpnLinksPanel />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, email o NPN..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-1.5">
            {INSURER_OPTIONS.map(i => (
              <button
                key={i}
                onClick={() => { setInsurer(i); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  insurer === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {INSURER_LABELS[i]}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {data.data.map(row => (
            <div key={row.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{row.name}</p>
                  <p className="text-xs text-gray-500">
                    {row.email} · {row.phone}
                    <span className="ml-2 text-gray-400">· NPN: {row.npn_name}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${INSURER_BADGE[row.insurer] || 'bg-gray-100 text-gray-600'}`}>
                  {INSURER_LABELS[row.insurer] || row.insurer}
                </span>
                <p className="hidden sm:block text-xs text-gray-400">
                  {new Date(row.created_at).toLocaleString('es-CO')}
                </p>
                {!!row.has_social_photo && (
                  <button onClick={() => openPhoto(row.id, 'social', 'Foto seguro social')}
                    title="Ver foto seguro social"
                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                    <ImageIcon className="h-4 w-4" />
                  </button>
                )}
                {!!row.has_status_photo && (
                  <button onClick={() => openPhoto(row.id, 'status', 'Foto estatus migratorio')}
                    title="Ver foto estatus migratorio"
                    className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-50 transition-colors">
                    <ImageIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!data.data.length && (
            <p className="p-8 text-center text-gray-400 text-sm">No se encontraron registros</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Total: {data.total} registros</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!photoModal} onClose={() => setPhotoModal(null)} title={photoModal?.title || ''}>
        {photoModal && <img src={photoModal.url} alt={photoModal.title} className="w-full rounded-lg" />}
      </Modal>
    </Layout>
  );
}
