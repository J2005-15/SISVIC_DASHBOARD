import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Pencil, Trash2, X, Save, Mail,
  Phone, MapPin, ChevronLeft, User, AlertTriangle, Loader
} from 'lucide-react';
import { propietariosService } from '../services/api';
import PaginadorPremium from '../components/PaginadorPremium';

const SECTORES = {
  1: 'El Pedregal',
  2: 'La Victoria',
  3: 'Santa Rosa',
  4: 'Las Lomas',
  5: 'El Centro'
}

const FORM_VACIO = { full_name: '', phone_number: '', id_sector: '', address: '', id_card: '' }

const REGISTROS_POR_PAGINA = 10

const CLS_INPUT =
  'w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 ' +
  'focus:border-[#765A05] transition-all duration-200'

// ─── Componentes auxiliares ──────────────────────────────────────────────────

function ModalOverlay({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl shadow-[#765A05]/20 w-full max-w-lg">
        {children}
      </div>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

export default function GestionPropietarios({ setVistaActual, readOnly = false }) {
  const [propietarios, setPropietarios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [vistaForm, setVistaForm] = useState(false)
  const [formulario, setFormulario] = useState(FORM_VACIO)
  const [errorForm, setErrorForm] = useState('')
  const [modalEditar, setModalEditar] = useState(null)
  const [formEditar, setFormEditar] = useState(FORM_VACIO)
  const [errorEditar, setErrorEditar] = useState('')
  const [modalBorrar, setModalBorrar] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  // ── Búsqueda y paginación en servidor ─────────────────────────────────────
  const [busquedaAplicada, setBusquedaAplicada] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalRegistros, setTotalRegistros] = useState(0)

  // Se recarga cada vez que cambia la página o la búsqueda aplicada
  useEffect(() => {
    cargarPropietarios()
  }, [paginaActual, busquedaAplicada])

  // Debounce: espera 400ms de inactividad antes de filtrar, y vuelve a la
  // página 1 (un filtro nuevo invalida la posición de paginación actual)
  useEffect(() => {
    const id = setTimeout(() => {
      setPaginaActual(1)
      setBusquedaAplicada(busqueda)
    }, 400)
    return () => clearTimeout(id)
  }, [busqueda])

  const cargarPropietarios = async () => {
    try {
      setCargando(true)
      setError(null)
      const respuesta = await propietariosService.getAll({
        page: paginaActual,
        limit: REGISTROS_POR_PAGINA,
        search: busquedaAplicada,
      })
      const cuerpo = respuesta.data || {}
      const { totalRecords, totalPages } = cuerpo.metadata || {}
      setPropietarios(cuerpo.data || [])
      setTotalPaginas(totalPages || 1)
      setTotalRegistros(totalRecords || 0)
    } catch (err) {
      const mensaje = err.response?.data?.message || err.message || 'Error al conectar con el servidor'
      setError('Error al cargar propietarios: ' + mensaje)
      console.error('Error:', err)
      setPropietarios([])
    } finally {
      setCargando(false)
    }
  }

  // ── Formulario de registro ────────────────────────────────────────────────

  const cambio = (campo, valor) => setFormulario(f => ({ ...f, [campo]: valor }))

  const abrirForm = () => { setFormulario(FORM_VACIO); setErrorForm(''); setVistaForm(true) }
  const cancelarForm = () => { setVistaForm(false); setErrorForm('') }

  const guardar = async (e) => {
    e.preventDefault()
    if (!formulario.full_name.trim() || !formulario.phone_number.trim() || !formulario.id_card.trim() || !formulario.id_sector || !formulario.address.trim()) {
      setErrorForm('Todos los campos son obligatorios.')
      return
    }

    try {
      setCargando(true)
      await propietariosService.create(formulario)
      setVistaForm(false)
      setFormulario(FORM_VACIO)
      await cargarPropietarios()
    } catch (err) {
      setErrorForm('Error: ' + (err.response?.data?.message || err.message))
      console.error('Error:', err)
    } finally {
      setCargando(false)
    }
  }

  // ── Editar modal ──────────────────────────────────────────────────────────

  const abrirEditar = (p) => {
    setFormEditar({
      full_name: p.full_name,
      phone_number: p.phone_number,
      id_sector: p.id_sector,
      address: p.address,
      id_card: p.id_card || ''
    })
    setErrorEditar('')
    setModalEditar(p)
  }

  const cambioEditar = (campo, valor) => setFormEditar(f => ({ ...f, [campo]: valor }))

  const confirmarEditar = async () => {
    if (!formEditar.full_name.trim() || !formEditar.phone_number.trim() || !formEditar.id_card.trim() || !formEditar.id_sector || !formEditar.address.trim()) {
      setErrorEditar('Todos los campos son obligatorios.')
      return
    }

    try {
      setCargando(true)
      await propietariosService.update(modalEditar.id_owner, formEditar)
      setModalEditar(null)
      await cargarPropietarios()
    } catch (err) {
      setErrorEditar('Error: ' + (err.response?.data?.message || err.message))
      console.error('Error:', err)
    } finally {
      setCargando(false)
    }
  }

  // ── Borrar modal ──────────────────────────────────────────────────────────

  const confirmarBorrar = async () => {
    try {
      setCargando(true)
      await propietariosService.delete(modalBorrar.id_owner)
      setModalBorrar(null)
      await cargarPropietarios()
    } catch (err) {
      console.error('Error:', err)
      setError('Error al eliminar: ' + (err.response?.data?.message || err.message))
    } finally {
      setCargando(false)
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  VISTA: FORMULARIO DE REGISTRO
  // ════════════════════════════════════════════════════════════════

  if (vistaForm) {
    return (
      <div className="space-y-5 max-w-3xl">

        <button
          type="button"
          onClick={cancelarForm}
          className="flex items-center gap-1.5 text-sm text-[#765A05]/65 hover:text-[#765A05] transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al Registro de Propietarios
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#765A05]/10 border border-[#765A05]/20 rounded-xl flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-[#765A05]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Registrar Nuevo Propietario</h2>
            <p className="text-sm text-gray-400 mt-0.5">Complete los datos del titular para vincularlo en el sistema.</p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-xl shadow-[#765A05]/5 rounded-3xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#765A05] via-[#FFDF96] to-[#765A05]/40" />

          <form onSubmit={guardar} className="p-7 space-y-6">

            <div>
              <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">Datos Personales</p>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <Campo label="Nombre Completo">
                    <input
                      type="text"
                      value={formulario.full_name}
                      onChange={e => cambio('full_name', e.target.value)}
                      placeholder="Ej: Carlos Antonio Rodríguez Pérez"
                      required
                      className={CLS_INPUT}
                    />
                  </Campo>
                </div>
                <Campo label="Teléfono">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={formulario.phone_number}
                      onChange={e => cambio('phone_number', e.target.value)}
                      placeholder="0424-555-1234"
                      required
                      className={`${CLS_INPUT} pl-9`}
                    />
                  </div>
                </Campo>
                <Campo label="Cédula de Identidad">
                  <input
                    type="text"
                    value={formulario.id_card}
                    onChange={e => cambio('id_card', e.target.value)}
                    placeholder="Ej: V-12345678"
                    required
                    className={CLS_INPUT}
                  />
                </Campo>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">Ubicación</p>
              <div className="grid grid-cols-2 gap-5">
                <Campo label="Sector">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <select
                      value={formulario.id_sector}
                      onChange={e => cambio('id_sector', e.target.value)}
                      className={`${CLS_INPUT} pl-9 appearance-none`}
                      required
                    >
                      <option value="">Seleccionar sector...</option>
                      {Object.entries(SECTORES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select>
                  </div>
                </Campo>
                <Campo label="Dirección">
                  <input
                    type="text"
                    value={formulario.address}
                    onChange={e => cambio('address', e.target.value)}
                    placeholder="Av., calle, número de casa..."
                    required
                    className={CLS_INPUT}
                  />
                </Campo>
              </div>
            </div>

            {errorForm && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errorForm}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button type="button" onClick={cancelarForm}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={cargando}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#765A05] hover:bg-[#5a4304] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                {cargando ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {cargando ? 'Guardando...' : 'Guardar Propietario'}
              </button>
            </div>

          </form>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════
  //  VISTA: TABLA DE PROPIETARIOS
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Error de carga ── */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#765A05]/10 border border-[#765A05]/20 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#765A05]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Registro de Propietarios</h2>
            <p className="text-sm text-gray-400 mt-0.5">Titulares registrados en el sistema SISCVI — Misión Nevado</p>
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={abrirForm}
            disabled={cargando}
            className="flex items-center gap-2 bg-[#765A05] hover:bg-[#5a4304] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Propietario
          </button>
        )}
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-xl shadow-[#765A05]/5 rounded-3xl overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-100/70 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, teléfono o sector..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition-all"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium bg-[#FFDF96]/20 border border-[#FFDF96]/30 px-2.5 py-1.5 rounded-lg shrink-0">
            {cargando ? 'Cargando...' : `${totalRegistros} registro${totalRegistros !== 1 ? 's' : ''}`}
          </span>
        </div>

        {cargando && propietarios.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader className="w-8 h-8 text-[#765A05]/40 animate-spin" />
            <p className="text-sm text-gray-400">Cargando propietarios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-[#FFDF96]/10 border-b border-gray-100/70">
                  {['Nombres Completos', 'Cédula', 'Teléfono', 'Sector', 'Acciones'].map((col, i) => (
                    <th
                      key={col}
                      className={`text-[11px] font-bold text-[#765A05]/60 uppercase tracking-wider px-5 py-3 whitespace-nowrap ${i === 4 ? 'text-right' : 'text-left'}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {propietarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Users className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400 font-medium">
                        {busquedaAplicada
                          ? 'No se encontraron resultados'
                          : 'No hay propietarios registrados aún'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  propietarios.map(p => (
                    <tr key={p.id_owner} className="border-b border-gray-50/80 last:border-0 hover:bg-[#FFDF96]/8 transition-colors">

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-[#765A05]/10 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-[#765A05]/60" />
                          </div>
                          <p className="text-sm font-semibold text-gray-800">{p.full_name}</p>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="text-sm text-gray-600 font-mono tracking-wide">{p.id_card}</p>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <p className="text-sm text-gray-600">{p.phone_number || '—'}</p>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFDF96]/25 text-[#765A05] border border-[#FFDF96]/40">
                          <MapPin className="w-3 h-3" />
                          {SECTORES[p.id_sector] || '—'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {!readOnly && (
                            <>
                              <button
                                onClick={() => abrirEditar(p)}
                                disabled={cargando}
                                className="p-1.5 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setModalBorrar(p)}
                                disabled={cargando}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 pb-5">
          <PaginadorPremium
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            cargando={cargando}
            onCambioPagina={setPaginaActual}
          />
        </div>
      </div>

      {/* ══════════ MODAL EDITAR ══════════ */}
      {modalEditar && (
        <ModalOverlay onClose={() => setModalEditar(null)}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Editar Propietario</h3>
            <button onClick={() => setModalEditar(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400" disabled={cargando}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <Campo label="Nombre Completo">
              <input type="text" value={formEditar.full_name} onChange={e => cambioEditar('full_name', e.target.value)}
                className={CLS_INPUT} placeholder="Nombre completo" required disabled={cargando} />
            </Campo>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Teléfono">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input type="tel" value={formEditar.phone_number} onChange={e => cambioEditar('phone_number', e.target.value)}
                    className={`${CLS_INPUT} pl-9`} placeholder="0424-555-0000" required disabled={cargando} />
                </div>
              </Campo>
              <Campo label="Cédula de Identidad">
                <input type="text" value={formEditar.id_card} onChange={e => cambioEditar('id_card', e.target.value)}
                  className={CLS_INPUT} placeholder="V-12345678" required disabled={cargando} />
              </Campo>
            </div>
            <Campo label="Sector">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <select value={formEditar.id_sector} onChange={e => cambioEditar('id_sector', e.target.value)}
                  className={`${CLS_INPUT} pl-9 appearance-none bg-white`} required disabled={cargando}>
                  <option value="">Seleccionar...</option>
                  {Object.entries(SECTORES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </div>
            </Campo>
            <Campo label="Dirección">
              <input type="text" value={formEditar.address} onChange={e => cambioEditar('address', e.target.value)}
                className={CLS_INPUT} placeholder="Dirección completa" required disabled={cargando} />
            </Campo>
          </div>
          {errorEditar && (
            <div className="mx-6 mb-4 flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5" />{errorEditar}
            </div>
          )}
          <div className="px-6 pb-5 flex justify-end gap-2.5">
            <button onClick={() => setModalEditar(null)} disabled={cargando} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50">Cancelar</button>
            <button onClick={confirmarEditar} disabled={cargando} className="flex items-center gap-2 px-4 py-2 bg-[#765A05] hover:bg-[#5a4304] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              {cargando ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {cargando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ══════════ MODAL BORRAR ══════════ */}
      {modalBorrar && (
        <ModalOverlay onClose={() => setModalBorrar(null)}>
          <div className="px-6 py-5 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-base font-bold text-gray-800">¿Eliminar este propietario?</h3>
            <p className="text-sm text-gray-500 mt-2">
              Estás a punto de eliminar a{' '}
              <strong className="text-gray-800">{modalBorrar.full_name}</strong>.
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="px-6 pb-5 flex justify-center gap-2.5">
            <button onClick={() => setModalBorrar(null)} disabled={cargando} className="px-5 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50">Cancelar</button>
            <button onClick={confirmarBorrar} disabled={cargando} className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              {cargando ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {cargando ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
