import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle, KeyRound, AlertTriangle } from 'lucide-react';
import { LOGO } from '../utils/constants/images';
import { usersService } from '../services/api';

const BG_IMAGE = 'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=800&q=80';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [nueva,        setNueva]        = useState('');
  const [confirmar,    setConfirmar]    = useState('');
  const [verNueva,     setVerNueva]     = useState(false);
  const [verConf,      setVerConf]      = useState(false);
  const [cargando,     setCargando]     = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [exito,        setExito]        = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      return setErrorMsg('El enlace no incluye un token válido. Solicita uno nuevo.');
    }
    if (nueva.length < 6) {
      return setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
    }
    if (nueva !== confirmar) {
      return setErrorMsg('Las contraseñas no coinciden.');
    }

    setCargando(true);
    try {
      await usersService.resetPassword(token, nueva);
      setExito(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message ?? 'Error de conexión. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#FFEFD1]">

      {/* ══════════════════════════════════════════
          PANEL IZQUIERDO — Foto perrito con overlay VERDE
      ══════════════════════════════════════════ */}
      <div
        className="hidden md:flex relative w-1/2 flex-col justify-between overflow-hidden rounded-r-[5rem] shadow-2xl z-10"
        style={{
          backgroundImage: `url(${BG_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 z-0 bg-green-800/85 rounded-r-[5rem]" />

        <div className="relative z-10 flex flex-col h-full px-14 py-14 justify-between">

          <div className="flex justify-start">
           <img src={LOGO} alt="Misión Nevado" className="w-full h-auto" />
          </div>

          <div className="space-y-6">
            <div className="w-12 h-1 bg-green-300 rounded-full" />
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              SISCVI<br />
              <span className="text-green-300">Nueva</span><br />
              Contraseña
            </h1>
            <p className="text-white/80 text-base leading-relaxed max-w-sm">
              Define una nueva clave segura para tu cuenta de operador administrativo
              de la Fundación Misión Nevado.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-green-200 shrink-0" />
            <p className="text-white/60 text-xs font-semibold tracking-wider uppercase">
              Proceso seguro — Enlace de un solo uso
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PANEL DERECHO — Formulario
      ══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">

        <div className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full bg-green-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-24 w-[380px] h-[380px] rounded-full bg-green-600/8 blur-[90px] pointer-events-none" />

        <div className="relative w-full max-w-md space-y-8 z-10">

          <div className="flex md:hidden justify-center mb-4">
            <img src={LOGO} alt="Misión Nevado" className="w-full h-auto" />
          </div>

          {exito ? (
            /* ── Pantalla de éxito ──────────────────── */
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-green-700">¡Contraseña actualizada!</h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Tu nueva contraseña ha sido guardada de forma segura.<br />
                  Ya puedes iniciar sesión con ella.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-green-300/30 transition-all cursor-pointer"
              >
                Ir al Login
              </button>
            </div>

          ) : !token ? (
            /* ── Token ausente en la URL ──────────────── */
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-red-700">Enlace inválido</h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Este enlace no incluye un token de recuperación. Solicita uno nuevo.
                </p>
              </div>
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-green-300/30 transition-all cursor-pointer"
              >
                Solicitar nuevo enlace
              </button>
            </div>

          ) : (
            /* ── Formulario de cambio de contraseña ── */
            <>
              <div className="space-y-1.5 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-green-700" />
                </div>
                <h2 className="text-2xl font-extrabold text-green-800 tracking-tight">
                  Restablecer Contraseña
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  Ingresa y confirma tu nueva clave de acceso.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-green-900/60 uppercase tracking-wider pl-1">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-700/50 pointer-events-none" />
                    <input
                      type={verNueva ? 'text' : 'password'}
                      value={nueva}
                      onChange={e => setNueva(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 focus:bg-white transition-all"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setVerNueva(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 transition-colors cursor-pointer">
                      {verNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-green-900/60 uppercase tracking-wider pl-1">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-700/50 pointer-events-none" />
                    <input
                      type={verConf ? 'text' : 'password'}
                      value={confirmar}
                      onChange={e => setConfirmar(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      required
                      className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 focus:bg-white transition-all"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setVerConf(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 transition-colors cursor-pointer">
                      {verConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {confirmar && (
                  <p className={`text-xs font-semibold pl-1 ${nueva === confirmar ? 'text-green-600' : 'text-red-500'}`}>
                    {nueva === confirmar ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                  </p>
                )}

                {errorMsg && (
                  <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-center">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full flex items-center justify-center gap-2.5 bg-green-700 hover:bg-green-800 active:bg-green-900 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-green-700/20 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 cursor-pointer"
                >
                  {cargando ? 'Guardando...' : 'Guardar Nueva Contraseña'}
                </button>

              </form>
            </>
          )}

          <div className="flex items-center justify-center gap-2 pt-4">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse shrink-0" />
            <p className="text-xs text-green-900/50 font-bold tracking-wide">
              Sistema operativo — Conexión segura
            </p>
          </div>
        </div>

        <p className="absolute bottom-5 text-xs text-gray-400 font-medium">
          © 2026{' '}
          <span className="text-green-800/60 font-bold">Fundación Misión Nevado — SISCVI</span>
        </p>
      </div>
    </div>
  );
}
