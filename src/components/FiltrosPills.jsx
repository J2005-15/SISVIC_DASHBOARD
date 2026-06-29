// Componente puro: recibe las opciones a mostrar, cuál está activa, y
// notifica el cambio hacia arriba. No sabe nada de censo, denuncias, etc.
// opciones: [{ label: 'Caninos', value: 'Canino' }, ...]
export default function FiltrosPills({ opciones, activo, onCambio }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {opciones.map(opcion => (
        <button
          key={opcion.value}
          type="button"
          onClick={() => onCambio(opcion.value)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border cursor-pointer ${
            activo === opcion.value
              ? 'bg-[#765A05] text-white border-[#765A05] shadow-md shadow-[#765A05]/25'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-[#FFDF96]/15 hover:border-[#FFDF96]/50 hover:text-[#765A05]'
          }`}
        >
          {opcion.label}
        </button>
      ))}
    </div>
  )
}
