import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navLink = ({ isActive }) =>
  `py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
    isActive
      ? 'border-indigo-600 text-indigo-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
  }`

export default function Layout() {
  const { profile, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white px-6 py-4 shadow flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Family Hub</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-75">{profile?.nome}</span>
          <button
            onClick={logout}
            className="text-sm opacity-60 hover:opacity-100 transition-opacity"
          >
            Sair
          </button>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 flex gap-6">
          <NavLink to="/" end className={navLink}>Início</NavLink>
          <NavLink to="/mural" className={navLink}>Mural</NavLink>
          <NavLink to="/calendario" className={navLink}>Calendário</NavLink>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
