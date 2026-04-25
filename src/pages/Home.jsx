import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { profile, session, logout } = useAuth()

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Perfil</h2>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center gap-3">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-sm"
          style={{ backgroundColor: profile?.cor ?? '#4f46e5' }}
        >
          {(profile?.nome ?? '?')[0].toUpperCase()}
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800">{profile?.nome ?? '…'}</h3>
          {session?.user?.email && (
            <p className="text-sm text-gray-400 mt-0.5">{session.user.email}</p>
          )}
          {profile?.papel && (
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 capitalize">
              {profile.papel}
            </span>
          )}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3.5 text-center text-sm font-semibold text-red-500 bg-white rounded-2xl shadow-sm hover:bg-red-50 transition-colors cursor-pointer"
      >
        Sair da conta
      </button>
    </div>
  )
}
