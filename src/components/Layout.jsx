import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Layout({ children, onLogout, user }) {
  const linkClass = ({ isActive }) =>
    isActive
      ? 'block px-3 py-2 rounded text-sm font-medium bg-indigo-50 text-indigo-700'
      : 'block px-3 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-100'

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="p-4 text-xl font-bold">SweetModels</div>
        <nav className="p-2 space-y-1 flex-1">
          <NavLink to="/" className={linkClass} end>
            Inicio
          </NavLink>
          <NavLink to="/reportes" className={linkClass}>
            Reportes
          </NavLink>
          <NavLink to="/usuarios" className={linkClass}>
            Usuarios
          </NavLink>
          <NavLink to="/configuracion" className={linkClass}>
            Configuración
          </NavLink>
        </nav>
        <div className="p-4 border-t">
          <button onClick={onLogout} className="w-full text-left text-sm text-red-600">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
