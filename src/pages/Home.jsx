import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { profile, logout } = useAuth()

  return (
    <div className="text-center py-16">
      <h2 className="text-3xl font-bold text-indigo-600 mb-3">
        Olá, {profile?.nome ?? '…'}!
      </h2>
      <p className="text-gray-400 mb-10">Bem-vindo ao Family Hub.</p>
      <button
        onClick={logout}
        className="text-sm text-gray-400 hover:text-red-500 transition-colors"
      >
        Sair
      </button>
    </div>
  )
}
