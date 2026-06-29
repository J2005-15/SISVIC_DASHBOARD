import { useState, useEffect } from 'react'
import { Save, Pencil, Trash2, ChevronDown, ChevronLeft, AlertTriangle, MapPin, User, Plus, Search, Loader } from 'lucide-react'
import { censoService, propietariosService } from '../services/api'
import PaginadorPremium from '../components/PaginadorPremium'
import FiltrosPills from '../components/FiltrosPills'

// ─── COMPONENTES AUXILIARES ─────────────────────────────────────────────────

function SelectCampo({ icon: Icon, name, value, onChange, children }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition ${Icon ? 'pl-9' : ''}`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

const BREED_OPTIONS = {
  canino: ['Mestizo', 'Poodle', 'Pinscher', 'Pitbull', 'Pastor Alemán', 'Labrador', 'Bulldog', 'Otro'],
  felino: ['Mestizo', 'Siamés', 'Persa', 'Bengalí', 'Maine Coon', 'Otro'],
}

const COLOR_OPTIONS = ['Negro', 'Blanco', 'Marrón', 'Gris', 'Dorado', 'Manchado', 'Bicolor', 'Tricolor']

const FORMULARIO_VACIO = {
  id_owner: '',
  animal_name: '',
  species: '',
  gender: '',
  breed: '',
  color: '',
  approx_age: '',
  census_date: '',
  symptoms: '',
  id_sector: '',
}

const REGISTROS_POR_PAGINA = 10

// Botones de acceso rápido por categoría — el value vacío ('Todos') no
// envía filtro de species al backend (ver cargarCenso).
const CATEGORIAS_ESPECIE = [
  { label: 'Todos',   value: '' },
  { label: 'Caninos', value: 'Canino' },
  { label: 'Felinos', value: 'Felino' },
  { label: 'Otros',   value: 'Otro' },
]

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────

export default function CensoAnimal({ setVistaActual, onGuardar }) {
  // Controla cuál de las dos vistas se muestra: tabla (false) o formulario (true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)

  const [registros, setRegistros] = useState([])
  const [propietarios, setPropietarios] = useState([])
  const [sectores, setSectores] = useState([])
  const [editando, setEditando] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  // ── Búsqueda, categoría y paginación en servidor ──────────────────────────
  const [busqueda, setBusqueda] = useState('')
  const [busquedaAplicada, setBusquedaAplicada] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalRegistros, setTotalRegistros] = useState(0)

  // Catálogos de apoyo (propietarios/sectores): se cargan una sola vez
  useEffect(() => {
    cargarCatalogos()
  }, [])

  // Tabla del censo: se recarga cada vez que cambia la página, la búsqueda
  // aplicada o la categoría de especie seleccionada
  useEffect(() => {
    cargarCenso()
  }, [pagina, busquedaAplicada, categoriaActiva])

  // Debounce de la búsqueda: espera 400ms de inactividad antes de filtrar,
  // y siempre vuelve a la página 1 (un filtro nuevo invalida la página actual)
  useEffect(() => {
    const id = setTimeout(() => {
      setPagina(1)
      setBusquedaAplicada(busqueda)
    }, 400)
    return () => clearTimeout(id)
  }, [busqueda])

  const cargarCenso = async () => {
    try {
      setCargando(true)
      setError(null)

      const respuesta = await censoService.getAll({
        page: pagina,
        limit: REGISTROS_POR_PAGINA,
        search: busquedaAplicada,
        species: categoriaActiva,
      })

      const cuerpo = respuesta.data || {}
      setRegistros(cuerpo.data || [])
      setTotalPaginas(cuerpo.metadata?.totalPages || 1)
      setTotalRegistros(cuerpo.metadata?.totalRecords || 0)
    } catch (err) {
      setError('Error al cargar datos: ' + (err.response?.data?.message || err.message))
      console.error('Error cargando censo:', err)
      setRegistros([])
    } finally {
      setCargando(false)
    }
  }

  const cargarCatalogos = async () => {
    try {
      // Cargar propietarios — catálogo completo para el <select> del
      // formulario, no una página: /owners ahora pagina por defecto (limit
      // 10), así que se pide explícitamente todo el catálogo.
      const respuestaPropietarios = await propietariosService.getAll({ limit: 1000 })
      setPropietarios(respuestaPropietarios.data?.data || [])

      // Cargar sectores (si está disponible en el response de propietarios o censos)
      // Por ahora usaremos un array default
      setSectores([
        { id_sector: 1, community_name: 'El Pedregal' },
        { id_sector: 2, community_name: 'La Victoria' },
        { id_sector: 3, community_name: 'Santa Rosa' },
        { id_sector: 4, community_name: 'Las Lomas' },
        { id_sector: 5, community_name: 'El Centro' },
      ])
    } catch (err) {
      setError('Error al cargar catálogos: ' + (err.response?.data?.message || err.message))
      console.error('Error cargando catálogos:', err)
    }
  }

  const manejarCambio = ({ target: { name, value } }) => {
    setFormulario(prev => {
      const newForm = { ...prev, [name]: value }
      if (name === 'species') {
        newForm.breed = ''
      }
      return newForm
    })
  }

  // Arma el payload JSON exacto que espera el backend: campos opcionales
  // vacíos ('') se omiten (no se envían como '') para que express-validator
  // no los rechace.
  const construirPayload = () => {
    const payload = {
      id_owner: formulario.id_owner,
      animal_name: formulario.animal_name.trim(),
      species: formulario.species,
      gender: formulario.gender,
      id_sector: formulario.id_sector,
    }
    if (formulario.breed)       payload.breed = formulario.breed
    if (formulario.color)       payload.color = formulario.color
    if (formulario.approx_age)  payload.approx_age = formulario.approx_age
    if (formulario.census_date) payload.census_date = formulario.census_date
    if (formulario.symptoms)    payload.symptoms = formulario.symptoms
    return payload
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formulario.id_owner || !formulario.animal_name || !formulario.species || !formulario.gender || !formulario.id_sector) {
      setError('Por favor completa los campos requeridos: propietario, nombre, especie, sexo y sector')
      return
    }

    try {
      setCargando(true)

      const payload = construirPayload()

      if (editando) {
        await censoService.update(editando, payload)
      } else {
        await censoService.create(payload)
      }

      // Éxito: limpia el formulario, vuelve a la Vista 1 (tabla) y refresca los registros
      limpiarFormulario()
      setEditando(null)
      setMostrarFormulario(false)
      await cargarCenso()

      if (onGuardar) onGuardar()
    } catch (err) {
      setError('Error al guardar: ' + (err.response?.data?.message || err.message))
      console.error('Error guardando:', err)
    } finally {
      setCargando(false)
    }
  }

  const limpiarFormulario = () => {
    setFormulario(FORMULARIO_VACIO)
  }

  const abrirNuevoRegistro = () => {
    setError(null)
    limpiarFormulario()
    setEditando(null)
    setMostrarFormulario(true)
  }

  const seleccionarEdicion = (registro) => {
    setError(null)
    setFormulario({ ...FORMULARIO_VACIO, ...registro })
    setEditando(registro.id_animal)
    setMostrarFormulario(true)
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este registro?')) return

    try {
      setCargando(true)
      await censoService.delete(id)
      await cargarCenso()
    } catch (err) {
      setError('Error al eliminar: ' + (err.response?.data?.message || err.message))
      console.error('Error eliminando:', err)
    } finally {
      setCargando(false)
    }
  }

  // Cambia la categoría de especie activa y vuelve a la página 1 — un
  // filtro nuevo invalida la posición de paginación que tenías antes
  const seleccionarCategoria = (valor) => {
    setPagina(1)
    setCategoriaActiva(valor)
  }

  // Vuelve a la Vista 1 (tabla) sin guardar nada y limpiando los campos
  const cancelar = () => {
    limpiarFormulario()
    setEditando(null)
    setError(null)
    setMostrarFormulario(false)
  }

  // ════════════════════════════════════════════════════════════════════════
  // VISTA 2 — FORMULARIO (registro o edición). Oculta la tabla por completo.
  // ════════════════════════════════════════════════════════════════════════
  if (mostrarFormulario) {
    return (
      <div className="space-y-8 max-w-3xl">
        {/* ENCABEZADO CON BOTÓN DE REGRESO */}
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={cancelar}
            title="Volver al listado"
            className="w-12 h-12 rounded-xl bg-[#E8D4B8] flex items-center justify-center shrink-0 hover:bg-[#dcc7a4] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 text-[#765A05]" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {editando ? 'Editar Registro de Censo Animal' : 'Nuevo Registro de Censo Animal'}
            </h2>
            <p className="text-sm text-[#765A05]/60 mt-0.5">Complete los datos del animal para agregarlo al censo.</p>
          </div>
        </div>

        <form onSubmit={guardar} className="bg-white/80 backdrop-blur-md border border-white/50 shadow-xl rounded-2xl overflow-hidden">
          {/* Línea decorativa */}
          <div className="h-1 bg-gradient-to-r from-[#765A05] via-[#FFDF96] to-[#765A05]/40" />

          <div className="p-8 space-y-8">
            {/* DATOS DEL ANIMAL */}
            <div>
              <h3 className="text-xs font-bold text-[#765A05] uppercase tracking-[0.15em] mb-6">Datos del Animal</h3>
              <div className="space-y-4">
                {/* Propietario */}
                <Campo label="Propietario">
                  <SelectCampo name="id_owner" value={formulario.id_owner} onChange={manejarCambio}>
                    <option value="">Seleccione propietario</option>
                    {propietarios.map(prop => (
                      <option key={prop.id_owner} value={prop.id_owner}>
                        {prop.full_name}
                      </option>
                    ))}
                  </SelectCampo>
                </Campo>

                {/* Nombre del Animal */}
                <Campo label="Nombre del Animal">
                  <input
                    type="text"
                    name="animal_name"
                    value={formulario.animal_name}
                    onChange={manejarCambio}
                    placeholder="Ej: Zeus"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05]"
                  />
                </Campo>

                {/* Especie y Raza (2 columnas) */}
                <div className="grid grid-cols-2 gap-4">
                  <Campo label="Especie">
                    <SelectCampo name="species" value={formulario.species} onChange={manejarCambio}>
                      <option value="">Seleccione especie</option>
                      <option value="Canino">Canino</option>
                      <option value="Felino">Felino</option>
                      <option value="Otro">Otro</option>
                    </SelectCampo>
                  </Campo>

                  <Campo label="Raza">
                    {formulario.species ? (
                      <SelectCampo name="breed" value={formulario.breed} onChange={manejarCambio}>
                        <option value="">Seleccione raza</option>
                        {BREED_OPTIONS[formulario.species.toLowerCase()]?.map(breed => (
                          <option key={breed} value={breed}>{breed}</option>
                        ))}
                      </SelectCampo>
                    ) : (
                      <input
                        type="text"
                        disabled
                        placeholder="Selecciona especie primero"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                      />
                    )}
                  </Campo>
                </div>

                {/* Color y Sexo (2 columnas) */}
                <div className="grid grid-cols-2 gap-4">
                  <Campo label="Color Predominante">
                    <SelectCampo name="color" value={formulario.color} onChange={manejarCambio}>
                      <option value="">Seleccione color</option>
                      {COLOR_OPTIONS.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </SelectCampo>
                  </Campo>

                  <Campo label="Sexo">
                    <SelectCampo name="gender" value={formulario.gender} onChange={manejarCambio}>
                      <option value="">Seleccione sexo</option>
                      <option value="M">Macho</option>
                      <option value="H">Hembra</option>
                    </SelectCampo>
                  </Campo>
                </div>

                {/* Edad Estimada */}
                <Campo label="Edad Estimada">
                  <input
                    type="text"
                    name="approx_age"
                    value={formulario.approx_age}
                    onChange={manejarCambio}
                    placeholder="Ej: 3 años"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05]"
                  />
                </Campo>
              </div>
            </div>

            {/* UBICACIÓN */}
            <div>
              <h3 className="text-xs font-bold text-[#765A05] uppercase tracking-[0.15em] mb-6">Ubicación</h3>
              <div className="space-y-4">
                {/* Sector y Fecha (2 columnas) */}
                <div className="grid grid-cols-2 gap-4">
                  <Campo label="Sector">
                    <SelectCampo icon={MapPin} name="id_sector" value={formulario.id_sector} onChange={manejarCambio}>
                      <option value="">Seleccionar sector...</option>
                      {sectores.map(sector => (
                        <option key={sector.id_sector} value={sector.id_sector}>
                          {sector.community_name}
                        </option>
                      ))}
                    </SelectCampo>
                  </Campo>

                  <Campo label="Fecha del Censo">
                    <input
                      type="date"
                      name="census_date"
                      value={formulario.census_date}
                      onChange={manejarCambio}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05]"
                    />
                  </Campo>
                </div>

                {/* Síntomas observados */}
                <Campo label="Síntomas Observados">
                  <textarea
                    name="symptoms"
                    value={formulario.symptoms}
                    onChange={manejarCambio}
                    rows={3}
                    placeholder="Ej: Tos persistente, cojera en pata trasera, sin síntomas aparentes..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05]"
                  />
                </Campo>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* BOTONES */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={cancelar}
                disabled={cargando}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="px-6 py-2.5 rounded-lg bg-[#765A05] text-white font-semibold hover:bg-[#5a4304] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {cargando ? 'Guardando...' : (editando ? 'Actualizar' : 'Guardar Animal')}
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // VISTA 1 — TABLA GENERAL (por defecto). Oculta el formulario por completo.
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-8 max-w-4xl">
      {/* ENCABEZADO */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E8D4B8] flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-[#765A05]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Censo Animal</h2>
            <p className="text-sm text-[#765A05]/60 mt-0.5">Listado de animales registrados en el censo.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={abrirNuevoRegistro}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#765A05] hover:bg-[#5a4304] text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-[#765A05]/10 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo Registro
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* TABLA DE REGISTROS */}
      <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-xl rounded-2xl overflow-hidden">
        <div className="p-8">

          {/* Barra superior: título + buscador */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold text-gray-800 shrink-0">Registros del Censo</h3>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por animal o propietario..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition-all"
              />
            </div>
          </div>

          {/* Botones de acceso rápido por categoría (especie) */}
          <div className="mb-6">
            <FiltrosPills
              opciones={CATEGORIAS_ESPECIE}
              activo={categoriaActiva}
              onCambio={seleccionarCategoria}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">Animal</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">Propietario</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">Especie</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">Raza</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">Color</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase">Sexo</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 text-xs uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cargando ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Loader className="w-7 h-7 text-[#765A05]/40 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Cargando registros...</p>
                    </td>
                  </tr>
                ) : registros.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      {busquedaAplicada || categoriaActiva ? 'No se encontraron coincidencias' : 'No hay registros de censo'}
                    </td>
                  </tr>
                ) : (
                  registros.map((reg) => (
                    <tr key={reg.id_animal} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-800">{reg.animal_name}</td>
                      <td className="px-4 py-3 text-gray-600">{reg.Owners?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{reg.species}</td>
                      <td className="px-4 py-3 text-gray-700">{reg.breed}</td>
                      <td className="px-4 py-3 text-gray-700">{reg.color}</td>
                      <td className="px-4 py-3 text-gray-700">{reg.gender === 'M' ? 'Macho' : 'Hembra'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => seleccionarEdicion(reg)}
                            disabled={cargando}
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminar(reg.id_animal)}
                            disabled={cargando}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
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

          {/* Controles de paginación premium (componente reutilizable) */}
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
