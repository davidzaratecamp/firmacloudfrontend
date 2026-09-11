import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { FIRMA_ROLES, CORREO_ROLES, HR_ROLES, RECLUTAMIENTO_ROLES, BEEMO_ROLES, ALL_ROLES } from '../utils/roles';
import { LayoutDashboard, FileText, SendHorizontal, LogOut, FileSignature, Menu, X, MailPlus, Inbox, Layers, Users, Briefcase, ClipboardCheck, GraduationCap, Bot } from 'lucide-react';

const NAV = [
  { to: '/dashboard',       label: 'Dashboard',        icon: LayoutDashboard, roles: ALL_ROLES    },
  { to: '/enviar',          label: 'Enviar Documento',  icon: SendHorizontal,  roles: FIRMA_ROLES  },
  { to: '/firmas',          label: 'Firmas',            icon: FileText,        roles: FIRMA_ROLES  },
  { to: '/enviar-carta',    label: 'Enviar Carta',      icon: MailPlus,        roles: CORREO_ROLES },
  { to: '/cartas',          label: 'Cartas',            icon: Inbox,           roles: CORREO_ROLES },
  { to: '/oleadas',         label: 'Oleadas',           icon: Layers,          roles: CORREO_ROLES },
  { to: '/actualizaciones-publicas', label: 'Actualizaciones (link público)', icon: ClipboardCheck, roles: CORREO_ROLES },
  { to: '/rrhh/enviar',     label: 'Enviar Contrato',   icon: Briefcase,       roles: HR_ROLES     },
  { to: '/rrhh/contratos',  label: 'Contratos',         icon: FileText,        roles: HR_ROLES     },
  { to: '/reclutamiento/candidatos', label: 'Reclutamiento', icon: GraduationCap, roles: RECLUTAMIENTO_ROLES },
  { to: '/beemo/enviar',    label: 'Enviar (Beemo)',    icon: SendHorizontal,  roles: BEEMO_ROLES  },
  { to: '/beemo/documentos', label: 'Beemo',            icon: Bot,             roles: BEEMO_ROLES  },
  { to: '/agentes',         label: 'Agentes',           icon: Users,           roles: []           },
];

function SidebarContent({ user, location, onNavigate, onLogout }) {
  return (
    <>
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-aurora shadow-glow">
            <FileSignature className="text-white h-4 w-4" />
          </div>
          <span className="text-white font-bold font-display text-lg tracking-tight">FirmaCloud</span>
        </div>
        <p className="text-slate-400 text-xs mt-1">Asiste Health Care</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.filter(({ roles }) => user?.role === 'admin' || roles.includes(user?.role)).map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link key={to} to={to} onClick={onNavigate}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}>
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-accent-500/20 border border-accent-400/40 shadow-glow"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative h-4 w-4" /><span className="relative">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-aurora flex items-center justify-center text-white text-sm font-bold shadow-glow">
            {user?.name?.[0] || 'A'}
          </div>
          <div>
            <p className="text-white text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-slate-400 text-xs mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-accent-400 text-sm transition-colors w-full">
          <LogOut className="h-4 w-4" />Cerrar sesión
        </button>
      </div>
    </>
  );
}

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { signOut(); navigate('/login'); };
  const closeMenu = () => setOpen(false);

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 bg-surface-950 flex-col flex-shrink-0">
        <SidebarContent user={user} location={location} onNavigate={closeMenu} onLogout={handleLogout} />
      </aside>

      {/* Overlay móvil */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="relative z-50 w-64 bg-surface-950 flex flex-col h-full"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <button onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
              <SidebarContent user={user} location={location} onNavigate={closeMenu} onLogout={handleLogout} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar móvil */}
        <header className="md:hidden flex items-center gap-3 bg-surface-950 px-4 py-3">
          <button onClick={() => setOpen(true)} className="text-white">
            <Menu className="h-5 w-5" />
          </button>
          <div className="p-1 rounded-md bg-aurora">
            <FileSignature className="text-white h-4 w-4" />
          </div>
          <span className="text-white font-bold font-display">FirmaCloud</span>
        </header>

        <main className="flex-1 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="p-4 md:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>

    </div>
  );
}
