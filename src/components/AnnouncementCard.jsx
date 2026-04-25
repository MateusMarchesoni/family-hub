const CATEGORY_STYLES = {
  Importante: 'bg-red-100 text-red-700',
  Lembrete:   'bg-yellow-100 text-yellow-700',
  Recado:     'bg-blue-100 text-blue-700',
  Conquista:  'bg-green-100 text-green-700',
}

const EMOJIS = ['👍', '❤️', '👀']

function timeAgo(dateStr) {
  const min = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (min < 1)  return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function AnnouncementCard({ announcement, reactions, currentProfileId, onDelete, onReact }) {
  const { id, autor, texto, categoria, fixado, criado_em, autor_id } = announcement
  const cardReactions = reactions.filter(r => r.announcement_id === id)

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${fixado ? 'border-indigo-200' : 'border-gray-100'}`}>
      {fixado && <p className="text-xs text-indigo-500 font-medium mb-2">📌 Fixado</p>}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: autor?.cor ?? '#4f46e5' }}
          >
            {(autor?.nome ?? '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 leading-none">{autor?.nome ?? 'Desconhecido'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(criado_em)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_STYLES[categoria]}`}>
            {categoria}
          </span>
          {autor_id === currentProfileId && (
            <button
              onClick={() => onDelete(id)}
              className="text-gray-300 hover:text-red-400 transition-colors leading-none"
              title="Deletar aviso"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed mb-4">{texto}</p>

      <div className="flex gap-2">
        {EMOJIS.map(emoji => {
          const emojiCount = cardReactions.filter(r => r.emoji === emoji)
          const hasReacted = emojiCount.some(r => r.profile_id === currentProfileId)
          return (
            <button
              key={emoji}
              onClick={() => onReact(id, emoji)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-colors ${
                hasReacted
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-100'
              }`}
            >
              {emoji}
              {emojiCount.length > 0 && (
                <span className="text-xs font-medium">{emojiCount.length}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
