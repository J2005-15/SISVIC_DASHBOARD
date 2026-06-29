import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, User, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LOGO } from '../utils/constants/images';

const BG_IMAGE =
  'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=800&q=80';

export default function Login() {
  const { login } = useAuth();
  const [USR_LOGIN, setUsrLogin] = useState('');
  const [PWD_LOGIN, setPwdLogin] = useState('');
  const [recordarSesion, setRecordarSesion] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando]               = useState(false);
  const [errorMsg, setErrorMsg]               = useState('');

  const manejarIngreso = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg('');

    if (!PWD_LOGIN.trim()) {
      setErrorMsg('Ingresa tu contraseña para continuar.');
      setCargando(false);
      return;
    }

    try {
      const resultado = await login(USR_LOGIN, PWD_LOGIN);
      if (!resultado.success) {
        setErrorMsg(resultado.error || 'Email o contraseña incorrectos');
      }
      // La redirección a /panel/inicio ocurre automáticamente via App.jsx
    } catch (error) {
      setErrorMsg('Error de conexión. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#FFEFD1]">

      {/* ══════════════════════════════════════════════════
          PANEL IZQUIERDO — Visual corporativo
      ══════════════════════════════════════════════════ */}
      <div
        className="hidden md:flex relative w-1/2 flex-col justify-between overflow-hidden rounded-r-[5rem] shadow-2xl z-10"
        style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Capa de color de marca sobre la fotografía */}
        <div className="absolute inset-0 z-0 bg-[#765A05]/85 rounded-r-[5rem]" />

        {/* Contenido del panel visual */}
        <div className="relative z-10 flex flex-col h-full px-14 py-14 justify-between">

          {/* Logo institucional flotante */}
          <div className="relative z-20 flex justify-start">
            <img src={LOGO} alt="Misión Nevado" className="w-64 max-w-xs h-auto object-contain" />
          </div>

          {/* Texto central de bienvenida */}
          <div className="space-y-6">
            <div className="w-12 h-1 bg-[#CAA750] rounded-full" />
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              SISVIC
              <br />
              <span className="text-[#CAA750]">Sistema de</span>
              <br />
              Control
            </h1>
            <p className="text-white/80 text-base leading-relaxed max-w-sm">
              Plataforma administrativa de la Fundación Misión Nevado para
              la gestión y seguimiento institucional.
            </p>
          </div>

          {/* Pie del panel visual */}
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#FFEFD1] shrink-0" />
            <p className="text-white/60 text-xs font-semibold tracking-wider uppercase">
              Acceso restringido — Personal autorizado
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          PANEL DERECHO — Formulario de autenticación
      ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">

        {/* Manchas decorativas de fondo */}
        <div className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full bg-[#765A05]/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-24 w-[380px] h-[380px] rounded-full bg-[#765A05]/8 blur-[90px] pointer-events-none" />

        {/* Contenedor del formulario */}
        <div className="relative w-full max-w-md space-y-8 z-10">

          {/* Logo móvil flotante */}
          <div className="flex md:hidden justify-center mb-4">
            <img src={LOGO} alt="Misión Nevado" className="w-64 max-w-xs mx-auto h-auto object-contain" />
          </div>

          {/* Encabezado del formulario */}
          <div className="space-y-1.5 text-center">
            <h2 className="text-2xl font-extrabold text-[#765A05] tracking-tight">
              Acceso Administrativo
            </h2>
            <p className="text-sm text-amber-900/60 font-medium">
              Ingrese sus credenciales de operador para continuar.
            </p>
          </div>

          {/* Formulario de autenticación */}
          <form onSubmit={manejarIngreso} className="space-y-5">

            {/* Campo: Correo Electrónico */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-amber-900/60 uppercase tracking-wider pl-1">
                Usuario o Correo Electrónico
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#765A05]/50 pointer-events-none" />
                <input
                  type="email"
                  value={USR_LOGIN}
                  onChange={(e) => setUsrLogin(e.target.value)}
                  placeholder="admin@siscvi.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/30 focus:border-[#765A05] focus:bg-white transition-all duration-300"
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-amber-900/60 uppercase tracking-wider pl-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#765A05]/50 pointer-events-none" />
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={PWD_LOGIN}
                  onChange={(e) => setPwdLogin(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/30 focus:border-[#765A05] focus:bg-white transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#765A05] transition-colors cursor-pointer"
                >
                  {mostrarPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Opciones secundarias */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={recordarSesion}
                  onChange={(e) => setRecordarSesion(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-900/20 cursor-pointer accent-[#765A05]"
                />
                <span className="text-sm text-amber-900/60 font-medium">Recordar sesión</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-bold text-[#765A05]/70 hover:text-[#765A05] transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Mensaje de error de credenciales */}
            {errorMsg && (
              <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-center">
                {errorMsg}
              </p>
            )}

            {/* Botón principal de ingreso */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full flex items-center justify-center gap-2.5 bg-[#765A05] hover:bg-[#5a4304] active:bg-[#3d2d02] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-[#765A05]/20 hover:shadow-xl hover:shadow-[#765A05]/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2 cursor-pointer"
            >
              {cargando ? (
                <span className="text-sm tracking-wide">Verificando credenciales...</span>
              ) : (
                <>
                  <span className="text-sm tracking-wide">Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Estado del sistema */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <p className="text-xs text-amber-900/50 font-bold tracking-wide">
              Conectado a API Real
            </p>
          </div>
        </div>

        {/* Pie de página */}
        <p className="absolute bottom-5 text-xs text-amber-900/40 font-medium">
          © 2026{' '}
          <span className="text-[#765A05]/60 font-bold">
            Fundación Misión Nevado — SISVIC
          </span>
        </p>
      </div>
    </div>
  );
}
