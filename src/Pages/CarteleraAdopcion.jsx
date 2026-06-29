import React, { useState, useEffect } from 'react';
import { PawPrint, Plus, Pencil, Trash2, Search, X, Save, Loader, AlertTriangle } from 'lucide-react';
import { petsService } from '../services/api';
import PaginadorPremium from '../components/PaginadorPremium';
import FiltrosPills from '../components/FiltrosPills';

const ESTILOS_ESTADO = {
  Disponible: 'bg-green-100 text-green-700 border border-green-200',
  Adoptado:   'bg-blue-100 text-blue-700 border border-blue-200',
};

function BadgeEstado({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ESTILOS_ESTADO[estado] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {estado}
    </span>
  );
}

const COLUMNAS = ['Foto', 'Nombre', 'Especie', 'Raza', 'Edad', 'Estado', 'Acciones'];

const CLS = 'w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition-all';

// Pills de especie — mismos valores que CensoAnimal.jsx ('Canino'/'Felino'/'Otro')
// para mantener consistencia con el resto del sistema.
const CATEGORIAS_ESPECIE = [
  { label: 'Todos',   value: '' },
  { label: 'Caninos', value: 'Canino' },
  { label: 'Felinos', value: 'Felino' },
  { label: 'Otros',   value: 'Otro' },
];

const REGISTROS_POR_PAGINA = 10;

export default function CarteleraAdopcion({ setVistaActual }) {
  const [mascotas,     setMascotas]     = useState([]);
  const [cargando,     setCargando]     = useState(false);
  const [error,        setError]        = useState(null);
  const [editando,     setEditando]     = useState(null);   // mascota que se está editando
  const [formEdit,     setFormEdit]     = useState({});
  const [guardando,    setGuardando]    = useState(false);

  // ── Búsqueda, especie y paginación en servidor ────────────────────────────
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // Se recarga cada vez que cambia la página, la búsqueda aplicada o la especie
  useEffect(() => {
    cargar();
  }, [pagina, busquedaAplicada, categoriaActiva]);

  // Debounce: espera 400ms de inactividad antes de filtrar, y vuelve a la
  // página 1 (un filtro nuevo invalida la posición de paginación actual)
  useEffect(() => {
    const id = setTimeout(() => {
      setPagina(1);
      setBusquedaAplicada(busqueda);
    }, 400);
    return () => clearTimeout(id);
  }, [busqueda]);

  const cargar = async () => {
    try {
      setCargando(true);
      setError(null);
      const respuesta = await petsService.getAll({
        page: pagina,
        limit: REGISTROS_POR_PAGINA,
        search: busquedaAplicada,
        species: categoriaActiva,
      });
      const cuerpo = respuesta.data || {};
      const lista = (cuerpo.data ?? []).map(p => ({
        id:      p.id_pet,
        foto:    p.image_url,
        nombre:  p.name,
        especie: p.species,
        raza:    p.breed  ?? '—',
        edad:    p.age    ?? '—',
        estado:  p.status === 'available' ? 'Disponible' : 'Adoptado',
      }));
      setMascotas(lista);
      setTotalPaginas(cuerpo.metadata?.totalPages || 1);
      setTotalRegistros(cuerpo.metadata?.totalRecords || 0);
    } catch (err) {
      setError('Error al cargar la cartelera: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
      setMascotas([]);
    } finally {
      setCargando(false);
    }
  };

  // Cambia la especie activa y vuelve a la página 1 — un filtro nuevo
  // invalida la posición de paginación que tenías antes
  const seleccionarCategoria = (valor) => {
    setPagina(1);
    setCategoriaActiva(valor);
  };

  const abrirEdicion = (m) => {
    setFormEdit({ nombre: m.nombre, especie: m.especie, raza: m.raza === '—' ? '' : m.raza, edad: m.edad === '—' ? '' : m.edad });
    setEditando(m);
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    try {
      await petsService.update(editando.id, {
        name:    formEdit.nombre,
        species: formEdit.especie,
        breed:   formEdit.raza,
        age:     formEdit.edad,
      });
      setEditando(null);
      await cargar(); // recarga la lista desde la BD
    } catch (err) {
      alert('Error al guardar: ' + (err.response?.data?.message || err.message));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta mascota de la cartelera? Esta acción no se puede deshacer.')) return;
    try {
      await petsService.delete(id);
      await cargar();
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Encabezado del módulo ────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <PawPrint className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Cartelera de Adopción</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Mascotas publicadas en la web pública de Misión Nevado
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setVistaActual('formulario-mascota')}
          className="flex items-center gap-2 bg-[#765A05] hover:bg-[#5a4304] active:bg-[#3d2d02] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          🐾 Registrar Mascota
        </button>
      </div>

      {/* ── Error de carga ── */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Tarjeta con tabla ────────────────────────────────────── */}
      <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-[#765A05]/5 rounded-2xl">

        {/* Barra de búsqueda */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, especie o raza..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#765A05]/20 focus:border-[#765A05] transition-all"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg shrink-0">
            {totalRegistros} resultado{totalRegistros !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
          <FiltrosPills opciones={CATEGORIAS_ESPECIE} activo={categoriaActiva} onCambio={seleccionarCategoria} />
        </div>

        {/* Tabla con scroll horizontal */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {COLUMNAS.map((col, i) => (
                  <th
                    key={col}
                    className={`text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap ${i === COLUMNAS.length - 1 ? 'text-right' : 'text-left'}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-20 text-center">
                    <Loader className="w-8 h-8 text-[#765A05]/40 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">Cargando animales...</p>
                  </td>
                </tr>
              ) : mascotas.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="py-20 text-center">
                    <PawPrint className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">
                      {busquedaAplicada || categoriaActiva ? 'Sin resultados para esa búsqueda' : 'No hay animales registrados aún'}
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      {busquedaAplicada || categoriaActiva ? 'Intenta con otro nombre o especie' : 'Usa el botón "Registrar Mascota" para agregar el primero'}
                    </p>
                  </td>
                </tr>
              ) : (
                mascotas.map(m => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-[#FFDF96]/10 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <img
                        src={m.foto || 'https://placehold.co/40x40/dcfce7/166534?text=?'}
                        alt={m.nombre}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100 shadow-sm"
                        onError={e => { e.currentTarget.src = 'https://placehold.co/40x40/dcfce7/166534?text=?'; }}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-gray-900">{m.nombre}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-600">{m.especie}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-600">{m.raza}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-600">{m.edad}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <BadgeEstado estado={m.estado} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => abrirEdicion(m)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#765A05] hover:bg-[#FFDF96]/20 border border-gray-200 hover:border-[#FFDF96]/40 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => eliminar(m.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de la tabla */}
        <div className="px-5 py-3.5 border-t border-gray-50">
          <p className="text-xs text-gray-400">
            {totalRegistros} mascota{totalRegistros !== 1 ? 's' : ''} registrada{totalRegistros !== 1 ? 's' : ''} en total
          </p>
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

      {/* ── Modal de edición ──────────────────────────────────────── */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-[#FFEFD1] rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-5 relative">

            <button
              type="button"
              onClick={() => setEditando(null)}
              className="absolute top-4 right-4 text-amber-900/40 hover:text-[#765A05] text-xl font-bold transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-[#765A05]">Editar Animal</h3>
              <p className="text-xs text-amber-900/60 mt-0.5">Modificando: <strong>{editando.nombre}</strong></p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre</label>
                <input type="text" value={formEdit.nombre} onChange={e => setFormEdit(p => ({ ...p, nombre: e.target.value }))} className={CLS} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Especie</label>
                <select value={formEdit.especie} onChange={e => setFormEdit(p => ({ ...p, especie: e.target.value }))} className={CLS}>
                  <option value="Canino">Canino (Perro)</option>
                  <option value="Felino">Felino (Gato)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Raza</label>
                <input type="text" value={formEdit.raza} onChange={e => setFormEdit(p => ({ ...p, raza: e.target.value }))} className={CLS} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Edad</label>
                <input type="text" value={formEdit.edad} onChange={e => setFormEdit(p => ({ ...p, edad: e.target.value }))} className={CLS} />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarEdicion}
                disabled={guardando}
                className="flex-1 flex items-center justify-center gap-2 bg-[#765A05] hover:bg-[#5a4304] text-white font-bold py-2.5 rounded-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
