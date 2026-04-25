import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import AnnouncementCard from '../components/AnnouncementCard'
import AnnouncementForm from '../components/AnnouncementForm'

export default function Mural() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [reactions, setReactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const [{ data: ann, error: annErr }, { data: reac }] = await Promise.all([
      supabase
        .from('announcements')
        .select('*, autor:profiles!autor_id(nome, cor, avatar_url)')
        .order('fixado', { ascending: false })
        .order('criado_em', { ascending: false }),
      supabase.from('reactions').select('*'),
    ])
    if (annErr) console.error('Erro ao buscar avisos:', annErr.message)
    setAnnouncements(ann ?? [])
    setReactions(reac ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('mural-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, fetchAll)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchAll])

  async function handleCreate({ texto, categoria, fixado }) {
    if (!profile?.id) throw new Error('Perfil não carregado. Tente novamente.')
    const { error } = await supabase.from('announcements').insert({
      texto,
      categoria,
      fixado,
      autor_id: profile.id,
    })
    if (error) throw new Error(error.message)
  }

  async function handleDelete(id) {
    await supabase.from('announcements').delete().eq('id', id)
  }

  async function handleReact(announcementId, emoji) {
    const existing = reactions.find(
      r => r.announcement_id === announcementId && r.profile_id === profile.id && r.emoji === emoji
    )
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('reactions').insert({
        announcement_id: announcementId,
        profile_id: profile.id,
        emoji,
      })
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Mural de Avisos</h2>

      <AnnouncementForm onSubmit={handleCreate} />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <p className="text-center text-gray-400 py-16 text-sm">Nenhum aviso ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-4">
          {announcements.map(ann => (
            <AnnouncementCard
              key={ann.id}
              announcement={ann}
              reactions={reactions}
              currentProfileId={profile?.id}
              onDelete={handleDelete}
              onReact={handleReact}
            />
          ))}
        </div>
      )}
    </div>
  )
}
