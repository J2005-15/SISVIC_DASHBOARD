import React, { useState } from 'react';
import { Settings, ChevronRight, Database, Bell, Shield, Palette, X, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function ModalOverlay({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl shadow-[#765A05]/20 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

function SwitchRow({ label, active, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!active)}
        className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${active ? 'bg-[#765A05]' : 'bg-gray-200'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${active ? 'left-5' : 'left-1'}`}
        />
      </button>
    </div>
  );
}

function ModalHeader({ titulo, onClose }) {
  return (
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h3 className="text-base font-bold text-gray-800">{titulo}</h3>
      <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ModalFooter({ onClose, onGuardar, guardado }) {
  return (
    <div className="px-6 pb-5 flex items-center justify-end gap-2.5">
      {guardado ? (
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
          <CheckCircle className="w-4 h-4" />
          Guardado
        </div>
      ) : (
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            className="flex items-center gap-2 px-4 py-2 bg-[#765A05] hover:bg-[#5a4304] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </>
      )}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

export default function Configuracion({ setVistaActual }) {
  const { usuario } = useAuth();

  if (usuario?.rol !== 'administrador') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Shield className="w-12 h-12 text-[#765A05]/30 mb-4" />
        <p className="text-sm font-semibold text-gray-500">Acceso restringido</p>
        <p className="text-xs text-gray-400 mt-1">Esta sección requiere rol de administrador.</p>
      </div>
    );
  }

  // ── Modal activo ──────────────────────────────────────────────────────────
  const [modalActivo, setModalActivo] = useState(null);
  const [guardado,    setGuardado]    = useState(false);

  // ── Estados de configuración ──────────────────────────────────────────────
  const [configDB, setConfigDB] = useState({
    host:    'ep-main-cluster.neon.tech',
    puerto:  '5432',
    base:    'siscvi_db',
    usuario: 'admin_siscvi',
  });

  const [configNotif, setConfigNotif] = useState({
    alertaEmail:      true,
    alertaStock:      true,
    alertaConsultas:  false,
    resumenDiario:    true,
  });

  const [configSeg, setConfigSeg] = useState({
    tiempoSesion: '60',
    intentosMax:  '3',
    logActividad: true,
    dobleAuth:    false,
  });

  const [configAp, setConfigAp] = useState({
    tema:   'dorado',
    fuente: 'normal',
  });

  const abrirModal = (id) => {
    setGuardado(false);
    setModalActivo(id);
  };

  const cerrarModal = () => setModalActivo(null);

  const guardarConfig = () => {
    setGuardado(true);
    setTimeout(() => {
      setGuardado(false);
      setModalActivo(null);
    }, 1200);
  };

  // ── Secciones ─────────────────────────────────────────────────────────────
  const secciones = [
    {
      id:          'db',
      icono:       Database,
      titulo:      'Conexión a Base de Datos',
      descripcion: 'Parámetros de conexión al cluster Neon PostgreSQL.',
      color:       'bg-sky-100 text-sky-600',
    },
    {
      id:          'notif',
      icono:       Bell,
      titulo:      'Notificaciones del Sistema',
      descripcion: 'Configurar alertas automáticas y umbrales de inventario.',
      color:       'bg-amber-100 text-amber-700',
    },
    {
      id:          'seg',
      icono:       Shield,
      titulo:      'Seguridad y Accesos',
      descripcion: 'Políticas de contraseña, tiempo de sesión y permisos.',
      color:       'bg-rose-100 text-rose-600',
    },
    {
      id:          'ap',
      icono:       Palette,
      titulo:      'Apariencia',
      descripcion: 'Colores institucionales y preferencias visuales del panel.',
      color:       'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Breadcrumb */}
      <button
        onClick={() => setVistaActual('inicio')}
        className="flex items-center gap-1.5 text-sm text-[#765A05]/65 hover:text-[#765A05] transition-colors font-medium cursor-pointer"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Volver al panel
      </button>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Configuración del Sistema</h2>
        <p className="text-sm text-[#765A05]/60 mt-0.5">Ajustes globales — solo accesibles para administradores</p>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-2 gap-4">
        {secciones.map(({ id, icono: Icono, titulo, descripcion, color }) => (
          <button
            key={id}
            onClick={() => abrirModal(id)}
            className="group bg-white/65 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl shadow-[#765A05]/8 p-5 flex items-start gap-4 text-left hover:bg-white/85 hover:shadow-2xl transition-all duration-300 cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icono className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">{titulo}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{descripcion}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#765A05] transition-colors mt-0.5 shrink-0" />
          </button>
        ))}
      </div>

      <div className="bg-[#FFDF96]/15 border border-[#FFDF96]/30 rounded-xl px-4 py-3 text-xs text-[#765A05]/70 font-medium">
        Los cambios en esta sección son simulados localmente y se conectarán al backend en producción.
      </div>

      {/* ══════════════════ MODAL: BASE DE DATOS ══════════════════ */}
      {modalActivo === 'db' && (
        <ModalOverlay onClose={cerrarModal}>
          <ModalHeader titulo="Conexión a Base de Datos" onClose={cerrarModal} />
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-2 text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-xl px-3.5 py-2.5">
              <Database className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Estos valores son de referencia. La conexión real se gestiona en las variables de entorno del servidor.</span>
            </div>
            {[
              { label: 'Host / Endpoint',  key: 'host'    },
              { label: 'Puerto',           key: 'puerto'  },
              { label: 'Base de Datos',    key: 'base'    },
              { label: 'Usuario',          key: 'usuario' },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
                <input
                  value={configDB[key]}
                  onChange={e => setConfigDB(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition"
                />
              </div>
            ))}
          </div>
          <ModalFooter onClose={cerrarModal} onGuardar={guardarConfig} guardado={guardado} />
        </ModalOverlay>
      )}

      {/* ══════════════════ MODAL: NOTIFICACIONES ══════════════════ */}
      {modalActivo === 'notif' && (
        <ModalOverlay onClose={cerrarModal}>
          <ModalHeader titulo="Notificaciones del Sistema" onClose={cerrarModal} />
          <div className="px-6 py-4">
            <SwitchRow
              label="Alertas por correo electrónico"
              active={configNotif.alertaEmail}
              onChange={v => setConfigNotif(p => ({ ...p, alertaEmail: v }))}
            />
            <SwitchRow
              label="Alertas de stock bajo en inventario"
              active={configNotif.alertaStock}
              onChange={v => setConfigNotif(p => ({ ...p, alertaStock: v }))}
            />
            <SwitchRow
              label="Notificación de nuevas consultas"
              active={configNotif.alertaConsultas}
              onChange={v => setConfigNotif(p => ({ ...p, alertaConsultas: v }))}
            />
            <SwitchRow
              label="Resumen diario automático"
              active={configNotif.resumenDiario}
              onChange={v => setConfigNotif(p => ({ ...p, resumenDiario: v }))}
            />
          </div>
          <ModalFooter onClose={cerrarModal} onGuardar={guardarConfig} guardado={guardado} />
        </ModalOverlay>
      )}

      {/* ══════════════════ MODAL: SEGURIDAD ══════════════════ */}
      {modalActivo === 'seg' && (
        <ModalOverlay onClose={cerrarModal}>
          <ModalHeader titulo="Seguridad y Accesos" onClose={cerrarModal} />
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiempo de sesión (min)</label>
                <input
                  type="number" min="15" max="480"
                  value={configSeg.tiempoSesion}
                  onChange={e => setConfigSeg(p => ({ ...p, tiempoSesion: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Intentos máximos</label>
                <input
                  type="number" min="1" max="10"
                  value={configSeg.intentosMax}
                  onChange={e => setConfigSeg(p => ({ ...p, intentosMax: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition"
                />
              </div>
            </div>
            <div className="pt-1">
              <SwitchRow
                label="Registro de actividad del sistema"
                active={configSeg.logActividad}
                onChange={v => setConfigSeg(p => ({ ...p, logActividad: v }))}
              />
              <SwitchRow
                label="Autenticación de dos factores (2FA)"
                active={configSeg.dobleAuth}
                onChange={v => setConfigSeg(p => ({ ...p, dobleAuth: v }))}
              />
            </div>
          </div>
          <ModalFooter onClose={cerrarModal} onGuardar={guardarConfig} guardado={guardado} />
        </ModalOverlay>
      )}

      {/* ══════════════════ MODAL: APARIENCIA ══════════════════ */}
      {modalActivo === 'ap' && (
        <ModalOverlay onClose={cerrarModal}>
          <ModalHeader titulo="Apariencia" onClose={cerrarModal} />
          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Tema de color</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'dorado',   color: 'bg-amber-500',   label: 'Dorado' },
                  { id: 'azul',     color: 'bg-sky-500',     label: 'Azul'   },
                  { id: 'verde',    color: 'bg-emerald-500', label: 'Verde'  },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setConfigAp(p => ({ ...p, tema: t.id }))}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      configAp.tema === t.id
                        ? 'border-[#765A05] bg-[#765A05]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${t.color} ${configAp.tema === t.id ? 'ring-2 ring-offset-1 ring-[#765A05]' : ''}`} />
                    <span className="text-xs font-semibold text-gray-700">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tamaño de fuente</label>
              <select
                value={configAp.fuente}
                onChange={e => setConfigAp(p => ({ ...p, fuente: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition bg-white"
              >
                <option value="pequeño">Pequeño</option>
                <option value="normal">Normal (Predeterminado)</option>
                <option value="grande">Grande</option>
              </select>
            </div>
          </div>
          <ModalFooter onClose={cerrarModal} onGuardar={guardarConfig} guardado={guardado} />
        </ModalOverlay>
      )}
    </div>
  );
}
