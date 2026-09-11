import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';
import { FileSignature, Loader2 } from 'lucide-react';

function SignatureOrb({ src, className, glow = 'shadow-glow', delay = 0 }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }, []);

  return (
    <motion.div
      className={`absolute rounded-full overflow-hidden border border-white/10 bg-white animate-float ${glow} ${className}`}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await login({ email, password });
      signIn(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-surface-950 overflow-hidden">
      {/* Fondo: grilla + glow */}
      <div className="absolute inset-0 bg-grid-glow" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <motion.div
        className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-accent-500/30 blur-3xl animate-float"
        aria-hidden="true"
      />
      <motion.div
        className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-violet-600/30 blur-3xl animate-float"
        style={{ animationDelay: '2s' }}
        aria-hidden="true"
      />
      <SignatureOrb src="/firma.mp4" className="hidden sm:block w-52 h-36 -top-14 left-[calc(50%-320px)]" glow="shadow-glow" delay={0} />
      <SignatureOrb src="/firma-digital.mp4" className="hidden md:block w-44 h-32 bottom-10 left-[calc(50%-360px)]" glow="shadow-glow-violet" delay={1} />
      <SignatureOrb src="/firma-2.mp4" className="hidden sm:block w-56 h-40 -bottom-16 right-[calc(50%-340px)]" glow="shadow-glow" delay={2} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-glow-lg p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-aurora shadow-glow"
          >
            <FileSignature className="h-7 w-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight">FirmaCloud</h1>
          <p className="text-slate-400 text-sm mt-1">Asiste Health Care</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-aurora text-white font-semibold py-2.5 rounded-lg shadow-glow hover:shadow-glow-lg transition-shadow flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Ingresando...' : 'Ingresar'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
