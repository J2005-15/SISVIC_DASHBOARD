import React from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout({ children }) {
  return (
    <div className="relative flex h-screen overflow-hidden bg-[#FFFBF0] font-sans">

      {/* Blobs decorativos de fondo */}
      <div className="absolute -top-40 -left-20 w-[560px] h-[560px] rounded-full bg-[#FFDF96]/25 blur-[110px] pointer-events-none z-0" />
      <div className="absolute -bottom-44 -right-20 w-[480px] h-[480px] rounded-full bg-[#FFDF96]/20 blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-[35%] right-[25%] w-[340px] h-[340px] rounded-full bg-[#765A05]/6 blur-[85px] pointer-events-none z-0" />
      <div className="absolute top-[5%] right-[8%] w-[220px] h-[220px] rounded-full bg-[#FFDF96]/15 blur-[65px] pointer-events-none z-0" />

      {/* Sidebar */}
      <Sidebar />

      {/* Columna principal: Header + Contenido */}
      <div className="relative flex flex-col flex-1 overflow-hidden z-10">
        <Header />

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
