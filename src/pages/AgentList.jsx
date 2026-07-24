import { useEffect, useState, useCallback } from 'react';
import { listAgents, createAgent, updateAgent } from '../api/agents';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { UserPlus, Loader2, Pencil } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'admin',        label: 'Administrador' },
  { value: 'firma_datos',  label: 'Firma - Tratamiento de Datos' },
  { value: 'correo_datos', label: 'Correo - Actualización de Datos' },
  { value: 'rrhh',         label: 'Recursos Humanos - Contratos Laborales' },
  { value: 'agent',        label: 'Agente (acceso completo, legado)' },
];

const ROLE_BADGE = {
  admin:        'bg-purple-100 text-purple-800',
  firma_datos:  'bg-blue-100 text-blue-800',
  correo_datos: 'bg-teal-100 text-teal-800',
  rrhh:         'bg-amber-100 text-amber-800',
  agent:        'bg-gray-100 text-gray-800',
};

function roleLabel(role) {
  return ROLE_OPTIONS.find(r => r.value === role)?.label || role;
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'firma_datos', active: true };

export default function AgentList() {
  const { user: me } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = crear, objeto = editar
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    return listAgents().then(r => setAgents(r.data)).catch(() => setError('No se pudo cargar la lista de agentes'));
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (agent) => {
    setEditing(agent);
    setForm({ name: agent.name, email: agent.email, password: '', role: agent.role, active: !!agent.active });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role, active: form.active };
        if (form.password) payload.password = form.password;
        await updateAgent(editing.id, payload);
      } else {
        await createAgent({ name: form.name, email: form.email, password: form.password, role: form.role });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'No se pudo guardar el agente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agentes</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <UserPlus className="h-4 w-4" /> Nuevo agente
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {agents.map(a => (
              <div key={a.id} onClick={() => openEdit(a)} className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {a.name}
                    {!a.active && <span className="ml-2 text-xs text-red-500 font-normal">(inactivo)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{a.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[a.role] || 'bg-gray-100 text-gray-800'}`}>
                    {roleLabel(a.role)}
                  </span>
                  <Pencil className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>
            ))}
            {!agents.length && (
              <p className="p-8 text-center text-gray-400 text-sm">Sin agentes registrados</p>
            )}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar agente' : 'Nuevo agente'}>
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{formError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña {editing && <span className="text-gray-400 font-normal">(dejar en blanco para no cambiarla)</span>}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required={!editing}
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              disabled={editing && editing.id === me?.id}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {editing && editing.id === me?.id && (
              <p className="text-xs text-gray-400 mt-1">No puedes cambiar tu propio rol.</p>
            )}
          </div>
          {editing && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.active}
                disabled={editing.id === me?.id}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              />
              Agente activo
            </label>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? 'Guardar cambios' : 'Crear agente'}
          </button>
        </form>
      </Modal>
    </Layout>
  );
}
