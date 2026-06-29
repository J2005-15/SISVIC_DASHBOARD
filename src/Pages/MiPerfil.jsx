import React, { useState } from 'react';
import { CircleUser, Mail, ShieldCheck, ChevronRight, Lock, Eye, EyeOff, Save, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersService } from '../services/api';

const FORMULARIO_VACIO = { current_password: '', new_password: '', confirm_password: '' };

export default function MiPerfil({ setVistaActual }) {
  const { usuario } = useAuth();

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [verActual,  setVerActual]  = useState(false);
  const [verNueva,   setVerNueva]   = useState(false);
  const [verConf,    setVerConf]    = useState(false);
  const [guardando,  setGuardando]  = useState(false);
  const [error,      setError]      = useState('');
  const [exito,      setExito]      = useState(false);

  const manejarCambio = (campo, valor) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }));
    setExito(false);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setExito(false);

    if (!formulario.current_password) {
      setError('Debes ingresar tu contraseña actual.');
      return;
    }
    if (formulario.new_password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (formulario.new_password !== formulario.confirm_password) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    try {
      setGuardando(true);
      await usersService.changePassword(formulario.current_password, formulario.new_password);
      setFormulario(FORMULARIO_VACIO);
      setExito(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña');
      console.error('Error:', err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Breadcrumb */}
      <button
        onClick={() => setVistaActual('inicio')}
        className="flex items-center gap-1.5 text-sm text-[#765A05]/65 hover:text-[#765A05] transition-colors font-medium cursor-pointer"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Volver al panel
      </button>

      {/* Tarjeta de perfil — solo lectura, datos del contexto de autenticación */}
      <div className="bg-white/65 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl shadow-[#765A05]/8 p-8">

        <div className="flex items-center gap-5 mb-8 pb-6 border-b border-[#765A05]/10">
          <div className="w-16 h-16 rounded-2xl bg-[#FFDF96]/40 border border-[#FFDF96]/40 flex items-center justify-center shrink-0">
            <CircleUser className="w-9 h-9 text-[#765A05]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">{usuario?.nombre ?? '—'}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#765A05]/60" />
              <span className="text-xs font-semibold text-[#765A05]/70 capitalize">
                {usuario?.rol ?? '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Nombre de usuario
            </label>
            <p className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-700">
              {usuario?.nombre ?? '—'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#765A05]/40" />
              <p className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700">
                {usuario?.email ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de cambio de contraseña */}
      <div className="bg-white/65 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl shadow-[#765A05]/8 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#765A05]/10 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-[#765A05]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800">Cambiar Contraseña</h3>
            <p className="text-xs text-gray-400 mt-0.5">Por seguridad, debes confirmar tu contraseña actual</p>
          </div>
        </div>

        <form onSubmit={guardar} className="space-y-4">

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contraseña Actual</label>
            <div className="relative">
              <input
                type={verActual ? 'text' : 'password'}
                value={formulario.current_password}
                onChange={e => manejarCambio('current_password', e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/70 border border-[#765A05]/15 rounded-xl px-4 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFDF96] focus:border-[#765A05]/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setVerActual(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#765A05] transition-colors cursor-pointer"
              >
                {verActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nueva Contraseña</label>
              <div className="relative">
                <input
                  type={verNueva ? 'text' : 'password'}
                  value={formulario.new_password}
                  onChange={e => manejarCambio('new_password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/70 border border-[#765A05]/15 rounded-xl px-4 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFDF96] focus:border-[#765A05]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setVerNueva(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#765A05] transition-colors cursor-pointer"
                >
                  {verNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Confirmar Nueva</label>
              <div className="relative">
                <input
                  type={verConf ? 'text' : 'password'}
                  value={formulario.confirm_password}
                  onChange={e => manejarCambio('confirm_password', e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full bg-white/70 border border-[#765A05]/15 rounded-xl px-4 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFDF96] focus:border-[#765A05]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setVerConf(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#765A05] transition-colors cursor-pointer"
                >
                  {verConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {exito && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              Contraseña actualizada exitosamente.
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#765A05] text-white text-sm font-semibold rounded-xl hover:bg-[#5a4304] transition-colors shadow-md shadow-[#765A05]/30 disabled:opacity-50 cursor-pointer"
            >
              {guardando ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {guardando ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
