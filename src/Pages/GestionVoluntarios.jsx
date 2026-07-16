import React, { useState, useEffect } from 'react'
import {
  Users, Plus, Search, Pencil, Trash2, Phone,
  ChevronLeft, User, AlertTriangle, Briefcase, Save, Loader
} from 'lucide-react'
import { volunteersService } from '../services/api'
import PaginadorPremium from '../components/PaginadorPremium'
import FiltrosPills from '../components/FiltrosPills'

const VOLUNTEER_TYPES = ['Rescates', 'Rehabilitación', 'Apoyo en Jornadas', 'Educación Comunitaria', 'Campañas de Incidencia', 'Capacitación']

// Pills de categoría (Área de Apoyo) — el value vacío ('Todos') no envía
// filtro volunteer_type al backend. El modelo Volunteers no tiene un campo
// de estado activo/inactivo, así que el área es la categoría disponible.
const CATEGORIAS_AREA = [
  { label: 'Todos', value: '' },
  ...VOLUNTEER_TYPES.map(tipo => ({ label: tipo, value: tipo })),
]

const FORMULARIO_VACIO = { first_name: '', last_name: '', dni_number: '', phone: '', volunteer_type: '' }

const CLS_INPUT =
  'w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 ' +
  'focus:border-[#765A05] transition-all duration-200'

const REGISTROS_POR_PAGINA = 4

function Campo({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  )
}

export default function GestionVoluntarios({ readOnly = false }) {
  // Controla cuál de las dos vistas se muestra: tabla (false) o formulario (true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [voluntarios, setVoluntarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error,    setError]    = useState(null)

  // ── Búsqueda, categoría y paginación en servidor ──────────────────────────
  const [busqueda, setBusqueda] = useState('')
  const [busquedaAplicada, setBusquedaAplicada] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalRegistros, setTotalRegistros] = useState(0)

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [editando,   setEditando]   = useState(null)
  const [errorForm,  setErrorForm]  = useState('')
  const [guardando,  setGuardando]  = useState(false)

  // Se recarga cada vez que cambia la página, la búsqueda aplicada o el área
  useEffect(() => {
    cargarVoluntarios()
  }, [pagina, busquedaAplicada, categoriaActiva])

  // Debounce: espera 400ms de inactividad antes de filtrar, y vuelve a la
  // página 1 (un filtro nuevo invalida la posición de paginación actual)
  useEffect(() => {
    const id = setTimeout(() => {
      setPagina(1)
      setBusquedaAplicada(busqueda)
    }, 400)
    return () => clearTimeout(id)
  }, [busqueda])

  const cargarVoluntarios = async () => {
    try {
      setCargando(true)
      setError(null)

      const respuesta = await volunteersService.getAll({
        page: pagina,
        limit: REGISTROS_POR_PAGINA,
        search: busquedaAplicada,
        volunteer_type: categoriaActiva,
      })

      const cuerpo = respuesta.data || {}
      setVoluntarios(cuerpo.data || [])
      setTotalPaginas(cuerpo.metadata?.totalPages || 1)
      setTotalRegistros(cuerpo.metadata?.totalRecords || 0)
    } catch (err) {
      setError('Error al cargar los voluntarios: ' + (err.response?.data?.message || err.message))
      console.error('Error:', err)
      setVoluntarios([])
    } finally {
      setCargando(false)
    }
  }

  const cambio = (campo, valor) => setFormulario(f => ({ ...f, [campo]: valor }))

  const abrirForm = () => {
    setFormulario(FORMULARIO_VACIO)
    setEditando(null)
    setErrorForm('')
    setMostrarFormulario(true)
  }

  const abrirEditar = (v) => {
    setFormulario({
      first_name:     v.first_name,
      last_name:      v.last_name,
      dni_number:     v.dni_number,
      phone:          v.phone,
      volunteer_type: v.volunteer_type,
    })
    setEditando(v.id_volunteer)
    setErrorForm('')
    setMostrarFormulario(true)
  }

  // Vuelve a la Vista 1 (tabla) sin guardar nada y limpiando los campos
  const cancelarForm = () => {
    setFormulario(FORMULARIO_VACIO)
    setEditando(null)
    setErrorForm('')
    setMostrarFormulario(false)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrorForm('')

    if (!formulario.first_name.trim() || !formulario.last_name.trim() || !formulario.dni_number.trim() || !formulario.volunteer_type) {
      setErrorForm('Nombre, apellido, cédula de identidad y área de apoyo son obligatorios.')
      return
    }

    try {
      setGuardando(true)

      if (editando) {
        await volunteersService.update(editando, formulario)
      } else {
        await volunteersService.create(formulario)
      }

      cancelarForm()
      await cargarVoluntarios()
    } catch (err) {
      setErrorForm('Error al guardar: ' + (err.response?.data?.message || err.message))
      console.error('Error:', err)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (v) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar a ${v.first_name} ${v.last_name}?`)) return

    try {
      setCargando(true)
      await volunteersService.delete(v.id_volunteer)
      await cargarVoluntarios()
    } catch (err) {
      setError('Error al eliminar: ' + (err.response?.data?.message || err.message))
      console.error('Error:', err)
    } finally {
      setCargando(false)
    }
  }

  // Cambia el área activa y vuelve a la página 1 — un filtro nuevo invalida
  // la posición de paginación que tenías antes
  const seleccionarCategoria = (valor) => {
    setPagina(1)
    setCategoriaActiva(valor)
  }

  // ════════════════════════════════════════════════════════════════════════
  // VISTA 2 — FORMULARIO (registro o edición). Oculta la tabla por completo.
  // ════════════════════════════════════════════════════════════════════════
  if (mostrarFormulario) {
    return (
      <div className="space-y-5 max-w-3xl">
        <button
          type="button"
          onClick={cancelarForm}
          className="flex items-center gap-1.5 text-sm text-[#765A05]/65 hover:text-[#765A05] transition-colors font-medium cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Gestión de Voluntarios
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#765A05]/10 border border-[#765A05]/20 rounded-xl flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-[#765A05]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              {editando ? 'Editar Voluntario' : 'Registrar Nuevo Voluntario'}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Complete los datos de la persona que desea aliarse para ayudarnos.</p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-xl shadow-[#765A05]/5 rounded-3xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#765A05] via-[#FFDF96] to-[#765A05]/40" />

          <form onSubmit={guardar} className="p-7 space-y-6">
            <div>
              <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">Información Personal</p>
              <div className="grid grid-cols-2 gap-5">
                <Campo label="Nombre">
                  <input
                    type="text"
                    value={formulario.first_name}
                    onChange={e => cambio('first_name', e.target.value)}
                    placeholder="Ej: María"
                    required
                    className={CLS_INPUT}
                  />
                </Campo>
                <Campo label="Apellido">
                  <input
                    type="text"
                    value={formulario.last_name}
                    onChange={e => cambio('last_name', e.target.value)}
                    placeholder="Ej: Pérez González"
                    required
                    className={CLS_INPUT}
                  />
                </Campo>
                <Campo label="Cédula de Identidad">
                  <input
                    type="text"
                    value={formulario.dni_number}
                    onChange={e => cambio('dni_number', e.target.value)}
                    placeholder="Ej: V-12345678"
                    required
                    className={CLS_INPUT}
                  />
                </Campo>
                <Campo label="Teléfono">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={formulario.phone}
                      onChange={e => cambio('phone', e.target.value)}
                      placeholder="0414-555-1234"
                      className={`${CLS_INPUT} pl-9`}
                    />
                  </div>
                </Campo>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[#765A05]/70 uppercase tracking-[0.18em] mb-4">Área de Apoyo</p>
              <div>
                <Campo label="Área de Apoyo">
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <select
                      value={formulario.volunteer_type}
                      onChange={e => cambio('volunteer_type', e.target.value)}
                      className={`${CLS_INPUT} pl-9 appearance-none`}
                      required
                    >
                      <option value="">Seleccionar área de apoyo...</option>
                      {VOLUNTEER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
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
              <button
                type="button"
                onClick={cancelarForm}
                disabled={guardando}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#765A05] hover:bg-[#5a4304] text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {guardando ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {guardando ? 'Guardando...' : 'Registrar Voluntario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // VISTA 1 — TABLA GENERAL (por defecto). Oculta el formulario por completo.
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#765A05]/10 border border-[#765A05]/20 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#765A05]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Gestión de Voluntarios</h2>
            <p className="text-sm text-gray-400 mt-0.5">Registro de personas que desean aliarse y ayudar a Misión Nevado</p>
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={abrirForm}
            className="flex items-center gap-2 bg-[#765A05] hover:bg-[#5a4304] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Voluntario
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-xl shadow-[#765A05]/5 rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100/70">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition-all"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-b border-gray-100/70">
          <FiltrosPills opciones={CATEGORIAS_AREA} activo={categoriaActiva} onCambio={seleccionarCategoria} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-[#FFDF96]/10 border-b border-gray-100/70">
                {['Nombre Completo', 'Teléfono', 'Área de Apoyo', 'Cédula', 'Acciones'].map((col, i) => (
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
              {cargando ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader className="w-8 h-8 text-[#765A05]/40 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">Cargando voluntarios...</p>
                  </td>
                </tr>
              ) : voluntarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Users className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">
                      {busquedaAplicada || categoriaActiva
                        ? 'No se encontraron resultados'
                        : 'No hay voluntarios registrados aún'}
                    </p>
                  </td>
                </tr>
              ) : (
                voluntarios.map(v => (
                  <tr key={v.id_volunteer} className="border-b border-gray-50/80 last:border-0 hover:bg-[#FFDF96]/8 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-[#765A05]/10 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-[#765A05]/60" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{v.first_name} {v.last_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <p className="text-sm text-gray-600 font-mono tracking-wide">{v.phone || '—'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFDF96]/25 text-[#765A05] border border-[#FFDF96]/40">
                        <Briefcase className="w-3 h-3" />
                        {v.volunteer_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{v.dni_number || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => abrirEditar(v)}
                          className="p-1.5 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminar(v)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 pb-5">
          <PaginadorPremium
            paginaActual={pagina}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            cargando={cargando}
            onCambioPagina={setPagina}
          />
        </div>
      </div>
    </div>
  )
}
