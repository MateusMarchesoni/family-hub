import { useState } from 'react'

const CATEGORIES = ['Recado', 'Lembrete', 'Importante', 'Conquista']

export default function AnnouncementForm({ onSubmit }) {
  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState('Recado')
  const [fixado, setFixado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!texto.trim()) return
    setError('')
    setLoading(true)
    try {
      await onSubmit({ texto: texto.trim(), categoria, fixado })
      setTexto('')
      setCategoria('Recado')
      setFixado(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
      <textarea
        value={texto}
        onChange={e => setTexto(e.target.value)}
        placeholder="Escreva um aviso para a família…"
        required
        rows={3}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={fixado}
            onChange={e => setFixado(e.target.checked)}
            className="accent-indigo-600"
          />
          Fixar aviso
        </label>

        <button
          type="submit"
          disabled={loading || !texto.trim()}
          className="ml-auto bg-indigo-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Publicando…' : 'Publicar'}
        </button>
      </div>
    </form>
  )
}
