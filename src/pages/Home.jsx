import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { profile } = useAuth()

  return (
    <div className="text-center py-16">
      <h2 className="text-3xl font-bold text-indigo-600 mb-3">
        Olá, {profile?.nome ?? '…'}!
      </h2>
      <p className="text-gray-400 mb-8">Bem-vindo ao Family Hub.</p>
      <Link
        to="/mural"
        className="inline-block bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Ver Mural de Avisos →
      </Link>
    </div>
  )
}
