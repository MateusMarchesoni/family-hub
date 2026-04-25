import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const IconMural = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  </svg>
)

const IconCalendar = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
)

const IconTasks = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />
  </svg>
)

const IconProfile = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
)

const NAV_ITEMS = [
  { to: '/mural',      label: 'Mural',      Icon: IconMural },
  { to: '/calendario', label: 'Calendário', Icon: IconCalendar },
  { to: '/tarefas',    label: 'Tarefas',    Icon: IconTasks },
  { to: '/',           label: 'Perfil',     Icon: IconProfile, end: true },
]

export default function Layout() {
  const { profile } = useAuth()

  return (
    <div className="min-h-dvh bg-[#F8F9FA] flex flex-col">
      <header className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
        <div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Family Hub</p>
          <h1 className="text-lg font-bold text-gray-800 leading-tight">
            Olá, {profile?.nome?.split(' ')[0] ?? '…'}!
          </h1>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
          style={{ backgroundColor: profile?.cor ?? '#4f46e5' }}
        >
          {(profile?.nome ?? '?')[0].toUpperCase()}
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-24 max-w-2xl w-full mx-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-20 bottom-nav-safe">
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors cursor-pointer ${
                isActive ? 'text-indigo-600' : 'text-gray-400'
              }`
            }
          >
            <Icon />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
