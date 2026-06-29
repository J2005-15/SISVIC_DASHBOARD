import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, ChevronLeft, ChevronDown, CheckCircle, ShieldCheck, PawPrint, User } from 'lucide-react';

const API_BASE = 'https://sisvic-api.onrender.com';

const CLS_INPUT =
  'w-full px-4 py-3 rounded-xl bg-white/80 border border-gray-200 text-sm text-gray-800 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 ' +
  'focus:border-[#765A05] focus:bg-white transition-all duration-200';

const ESTADO_BADGE = {
  Aprobada:    { cls: 'bg-green-100 text-green-700 border border-green-200',  dot: 'bg-green-500'  },
  'En Proceso':{ cls: 'bg-amber-100 text-amber-700 border border-amber-200',  dot: 'bg-amber-400'  },
  Rechazada:   { cls: 'bg-red-100 text-red-700 border border-red-200',         dot: 'bg-red-500'    },
};

function Campo({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function SelectCampo({ name, value, onChange, placeholder, children }) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className={`${CLS_INPUT} appearance-none pr-10 cursor-pointer`}
      >
        <option value="" disabled>{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

export default function FormularioTramiteAdopcion({ setVistaActual, solicitudSeleccionada }) {
  const [formulario, setFormulario] = useState({
    idCard:    '',
    nombre:    '',
    correo:    '',
    telefono:  '',
    direccion: '',
    estado:    '',
  });
  const [documentosVerificados, setDocumentosVerificados] = useState(false);
  const [cargando, setCargando]   = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');

  // Pre-rellena con datos de la solicitud cuando llega
  useEffect(() => {
    if (solicitudSeleccionada) {
      setFormulario(prev => ({
        ...prev,
        nombre:   solicitudSeleccionada.adoptante ?? '',
        correo:   solicitudSeleccionada.email     ?? '',
        telefono: solicitudSeleccionada.telefono  ?? '',
      }));
    }
  }, [solicitudSeleccionada]);

  const manejarCambio = ({ target: { name, value } }) =>
    setFormulario(prev => ({ ...prev, [name]: value }));

  const cancelar = () => {
    setVistaActual('solicitudes');
  };

  const procesar = async (e) => {
    e.preventDefault();
    if (!solicitudSeleccionada) {
      setErrorMsg('No se seleccionó ninguna solicitud. Vuelve a la lista.');
      return;
    }
    setCargando(true);
    setErrorMsg('');

    try {
      await axios.patch(
        `${API_BASE}/api/adoption-approve/${solicitudSeleccionada.id}`,
        {
          estado:       formulario.estado,
          full_name:    formulario.nombre,
          id_card:      formulario.idCard,
          phone_number: formulario.telefono,
          address:      formulario.direccion,
        }
      );
      setVistaActual('solicitudes');
    } catch (err) {
      setErrorMsg(err.response?.data?.message ?? 'Error al guardar el trámite. Intente nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const estadoInfo  = ESTADO_BADGE[formulario.estado] ?? null;
  const puedeSubmit = documentosVerificados && formulario.estado !== '' && !cargando;

  return (
    <div className="space-y-5 max-w-3xl">

      {/* ── Navegación de retorno ──────────────────────────────── */}
      <button
        type="button"
        onClick={cancelar}
        className="flex items-center gap-1.5 text-sm text-[#765A05]/65 hover:text-[#765A05] transition-colors font-medium cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver a Solicitudes de Adopción
      </button>

      {/* ── Encabezado ────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-rose-100 border border-rose-200 rounded-xl flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Trámite Formal de Adopción</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Registro administrativo y legal de la entrega del animal al adoptante.
          </p>
        </div>
      </div>

      {/* ── Tarjeta de resumen de la solicitud ────────────────── */}
      {solicitudSeleccionada ? (
        <div className="bg-[#FFDF96]/15 border border-[#FFDF96]/40 rounded-2xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 bg-[#765A05]/10 rounded-xl flex items-center justify-center shrink-0">
            <PawPrint className="w-5 h-5 text-[#765A05]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-wider mb-1">Solicitud que se está procesando</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span className="text-sm font-semibold text-gray-800">
                <span className="text-gray-400 font-normal">Mascota: </span>
                {solicitudSeleccionada.mascota}
              </span>
              <span className="text-sm font-semibold text-gray-800">
                <span className="text-gray-400 font-normal">Solicitante: </span>
                {solicitudSeleccionada.adoptante}
              </span>
              <span className="text-sm font-semibold text-gray-800">
                <span className="text-gray-400 font-normal">Fecha: </span>
                {solicitudSeleccionada.fecha}
              </span>
            </div>
          </div>
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold shrink-0">
            ID #{solicitudSeleccionada.id}
          </span>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 font-medium">
          Ninguna solicitud seleccionada. Regresa a la lista y haz clic en "Procesar".
        </div>
      )}

      {/* ── Formulario ────────────────────────────────────────── */}
      <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-xl shadow-[#765A05]/5 rounded-3xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 via-[#FFDF96] to-[#765A05]/40" />

        <form onSubmit={procesar} className="p-7 space-y-7">

          {/* ── Datos del Adoptante ────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-[#765A05]/60" />
              <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em]">
                Datos del Adoptante (confirmar con documento)
              </p>
            </div>

            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-5">
                <Campo label="Cédula de Identidad">
                  <input
                    type="text"
                    name="idCard"
                    value={formulario.idCard}
                    onChange={manejarCambio}
                    placeholder="Ej: V-12345678"
                    required
                    className={CLS_INPUT}
                  />
                </Campo>

                <Campo label="Nombre Completo">
                  <input
                    type="text"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    placeholder="Nombre del adoptante"
                    required
                    className={CLS_INPUT}
                  />
                </Campo>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Campo label="Correo Electrónico">
                  <input
                    type="email"
                    name="correo"
                    value={formulario.correo}
                    onChange={manejarCambio}
                    placeholder="correo@ejemplo.com"
                    className={CLS_INPUT}
                  />
                </Campo>

                <Campo label="Teléfono de Contacto">
                  <input
                    type="tel"
                    name="telefono"
                    value={formulario.telefono}
                    onChange={manejarCambio}
                    placeholder="0424-555-1234"
                    required
                    className={CLS_INPUT}
                  />
                </Campo>
              </div>

              <Campo label="Dirección de Residencia">
                <input
                  type="text"
                  name="direccion"
                  value={formulario.direccion}
                  onChange={manejarCambio}
                  placeholder="Ej: Urb. Las Mercedes, Calle 5, Casa 12"
                  required
                  className={CLS_INPUT}
                />
              </Campo>

            </div>
          </div>

          {/* ── Resolución del Trámite ────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">
              Resolución Administrativa del Trámite
            </p>

            <Campo label="Estado del Trámite de Adopción">
              <SelectCampo
                name="estado"
                value={formulario.estado}
                onChange={manejarCambio}
                placeholder="Seleccione la resolución..."
              >
                <option value="Aprobada">✅ Aprobada — Adopción completada y entregada</option>
                <option value="En Proceso">🔄 En Proceso — Trámite administrativo en curso</option>
                <option value="Rechazada">❌ Rechazada — No cumple los requisitos establecidos</option>
              </SelectCampo>
            </Campo>

            {estadoInfo && (
              <div className="mt-3 flex items-center gap-2.5">
                <span className="text-xs text-gray-500">Resolución seleccionada:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${estadoInfo.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${estadoInfo.dot}`} />
                  {formulario.estado}
                </span>
              </div>
            )}

            {formulario.estado === 'Aprobada' && (
              <p className="mt-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2 font-medium">
                Al aprobar: la mascota cambiará a estado "Adoptado" y el adoptante quedará registrado como propietario.
              </p>
            )}
          </div>

          {/* ── Declaración ──────────────────────────────────── */}
          <div className="bg-[#FFDF96]/10 border border-[#FFDF96]/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#765A05]/70 mt-0.5 shrink-0" />
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-[#765A05]/80 uppercase tracking-wider">
                  Declaración de Responsabilidad Institucional
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Al confirmar este trámite, el operador de guardia certifica que la identidad del
                  visitante fue verificada con documento oficial y que el proceso cumple íntegramente
                  con las políticas de bienestar animal de la Fundación Misión Nevado.
                </p>
                <label className="flex items-start gap-2.5 cursor-pointer select-none group mt-1">
                  <input
                    type="checkbox"
                    checked={documentosVerificados}
                    onChange={e => setDocumentosVerificados(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-amber-300 accent-[#765A05] cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-gray-600 group-hover:text-gray-800 transition-colors leading-relaxed">
                    Confirmo que la documentación del adoptante ha sido revisada y que este
                    trámite ha sido procesado conforme a los lineamientos institucionales.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* ── Error ────────────────────────────────────────── */}
          {errorMsg && (
            <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              {errorMsg}
            </p>
          )}

          {/* ── Botones ──────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100/80">
            <button
              type="button"
              onClick={cancelar}
              disabled={cargando}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl transition-all disabled:opacity-40"
            >
              Cancelar
            </button>

            <div className="flex flex-col items-end gap-1">
              <button
                type="submit"
                disabled={!puedeSubmit || !solicitudSeleccionada}
                className={`flex items-center gap-2.5 px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm ${
                  puedeSubmit && solicitudSeleccionada
                    ? 'bg-[#765A05] hover:bg-[#5a4304] active:bg-[#3d2d02] hover:shadow-md cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {cargando ? 'Guardando...' : 'Confirmar Trámite'}
              </button>
              {!documentosVerificados && !cargando && (
                <p className="text-[10px] text-gray-400 font-medium">
                  Confirme la declaración para habilitar este botón
                </p>
              )}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
