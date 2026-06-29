import { ChevronLeft, ChevronRight } from 'lucide-react'

// Componente puro: no conoce de dónde vienen los datos, solo recibe el
// estado de paginación y notifica el cambio de página hacia arriba.
export default function PaginadorPremium({
  paginaActual,
  totalPaginas,
  totalRegistros = 0,
  cargando = false,
  onCambioPagina,
}) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 pt-6 mt-6 border-t border-gray-100">
      <p className="text-xs text-gray-400 font-medium">
        {totalRegistros} registro{totalRegistros !== 1 ? 's' : ''} en total
      </p>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onCambioPagina(Math.max(1, paginaActual - 1))}
          disabled={cargando || paginaActual <= 1}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#765A05] bg-[#FFDF96]/15 hover:bg-[#FFDF96]/30 border border-[#765A05]/15 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#FFDF96]/15"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <div className="flex items-center gap-2 px-1">
          <span className="flex items-center justify-center min-w-[2.5rem] h-10 px-3 rounded-full bg-[#765A05] text-white font-bold text-sm shadow-md shadow-[#765A05]/30">
            {paginaActual}
          </span>
          <span className="text-sm text-gray-400 font-medium whitespace-nowrap">
            de {totalPaginas}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onCambioPagina(Math.min(totalPaginas, paginaActual + 1))}
          disabled={cargando || paginaActual >= totalPaginas}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#765A05] bg-[#FFDF96]/15 hover:bg-[#FFDF96]/30 border border-[#765A05]/15 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#FFDF96]/15"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
