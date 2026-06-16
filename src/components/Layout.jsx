import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, SendHorizontal, LogOut, FileSignature, Menu, X } from 'lucide-react';

const NAV = [
  { to: '/dashboard',  label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/enviar',     label: 'Enviar Documento',  icon: SendHorizontal  },
  { to: '/firmas',     label: 'Firmas',            icon: FileText        },
];

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { signOut(); navigate('/login'); };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-2">
          <FileSignature className="text-blue-300 h-6 w-6" />
          <span className="text-white font-bold text-lg">FirmaCloud</span>
        </div>
        <p className="text-blue-400 text-xs mt-1">Asiste Health Care</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              location.pathname.startsWith(to)
                ? 'bg-blue-600 text-white'
                : 'text-blue-200 hover:bg-blue-800 hover:text-white'
            }`}>
            <Icon className="h-4 w-4" />{label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-blue-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0] || 'A'}
          </div>
          <div>
            <p className="text-white text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-blue-400 text-xs mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-blue-300 hover:text-white text-sm transition-colors w-full">
          <LogOut className="h-4 w-4" />Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 bg-[#1e3a5f] flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Overlay móvil */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative z-50 w-64 bg-[#1e3a5f] flex flex-col h-full">
            <button onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-blue-300 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar móvil */}
        <header className="md:hidden flex items-center gap-3 bg-[#1e3a5f] px-4 py-3">
          <button onClick={() => setOpen(true)} className="text-white">
            <Menu className="h-5 w-5" />
          </button>
          <FileSignature className="text-blue-300 h-5 w-5" />
          <span className="text-white font-bold">FirmaCloud</span>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>

    </div>
  );
}
