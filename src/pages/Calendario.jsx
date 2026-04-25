import { useCallback, useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function toDatetimeLocal(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function EventModal({ slot, onClose, onSave }) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [inicio, setInicio] = useState(slot?.inicio ?? '')
  const [fim, setFim] = useState(slot?.fim ?? '')
  const [local, setLocal] = useState('')
  const [tipo, setTipo] = useState('familia')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) return setError('Título é obrigatório.')
    if (!inicio) return setError('Data/hora de início é obrigatória.')
    setSaving(true)
    setError('')
    try {
      await onSave({ titulo, descricao, inicio, fim: fim || null, local: local || null, tipo })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-5">Novo Evento</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Nome do evento"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início *</label>
              <input
                type="datetime-local"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={inicio}
                onChange={e => setInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
              <input
                type="datetime-local"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={fim}
                onChange={e => setFim(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={local}
              onChange={e => setLocal(e.target.value)}
              placeholder="Endereço ou nome do lugar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              rows={2}
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Detalhes adicionais..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidade</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={tipo}
              onChange={e => setTipo(e.target.value)}
            >
              <option value="familia">Família (todos veem)</option>
              <option value="individual">Particular (só eu)</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EventDetailModal({ event, currentProfileId, onClose, onDelete }) {
  const canDelete = event.extendedProps.criador_id === currentProfileId
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await onDelete(event.id)
    onClose()
  }

  const fmtDate = d =>
    d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
              style={{ backgroundColor: event.backgroundColor }}
            />
            <h3 className="text-lg font-semibold text-gray-800 truncate">{event.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-2 flex-shrink-0"
          >
            ×
          </button>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <p><span className="font-medium text-gray-700">Início:</span> {fmtDate(event.start)}</p>
          {event.end && (
            <p><span className="font-medium text-gray-700">Fim:</span> {fmtDate(event.end)}</p>
          )}
          {event.extendedProps.local && (
            <p><span className="font-medium text-gray-700">Local:</span> {event.extendedProps.local}</p>
          )}
          {event.extendedProps.descricao && (
            <p><span className="font-medium text-gray-700">Descrição:</span> {event.extendedProps.descricao}</p>
          )}
          <p>
            <span className="font-medium text-gray-700">Criado por:</span>{' '}
            {event.extendedProps.criador_nome}
          </p>
          <p>
            <span className="font-medium text-gray-700">Visibilidade:</span>{' '}
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
              event.extendedProps.tipo === 'familia'
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {event.extendedProps.tipo === 'familia' ? 'Família' : 'Particular'}
            </span>
          </p>
        </div>

        {canDelete && (
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Excluindo...' : 'Excluir evento'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Calendario() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const calendarRef = useRef(null)

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*, criador:profiles!criador_id(nome, cor)')
      .order('inicio', { ascending: true })
    if (error) { console.error('Erro ao buscar eventos:', error.message); return }
    setEvents(
      (data ?? []).map(ev => ({
        id: ev.id,
        title: ev.titulo,
        start: ev.inicio,
        end: ev.fim ?? undefined,
        backgroundColor: ev.criador?.cor ?? '#4f46e5',
        borderColor: ev.criador?.cor ?? '#4f46e5',
        textColor: '#ffffff',
        extendedProps: {
          descricao: ev.descricao,
          local: ev.local,
          tipo: ev.tipo,
          criador_id: ev.criador_id,
          criador_nome: ev.criador?.nome ?? 'Desconhecido',
        },
      }))
    )
  }, [])

  useEffect(() => {
    fetchEvents()
    const channel = supabase
      .channel('calendar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchEvents)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchEvents])

  async function handleCreate({ titulo, descricao, inicio, fim, local, tipo }) {
    if (!profile?.id) throw new Error('Perfil não carregado. Tente novamente.')
    const { error } = await supabase.from('events').insert({
      titulo,
      descricao: descricao || null,
      inicio: new Date(inicio).toISOString(),
      fim: fim ? new Date(fim).toISOString() : null,
      local: local || null,
      tipo,
      criador_id: profile.id,
    })
    if (error) throw new Error(error.message)
    await fetchEvents()
  }

  async function handleDelete(id) {
    await supabase.from('events').delete().eq('id', id)
    await fetchEvents()
  }

  function handleDateSelect(selectInfo) {
    setSelectedSlot({
      inicio: toDatetimeLocal(selectInfo.start),
      fim: toDatetimeLocal(selectInfo.end),
    })
    setShowCreateModal(true)
    calendarRef.current?.getApi().unselect()
  }

  function handleEventClick(clickInfo) {
    setSelectedEvent(clickInfo.event)
  }

  function openCreateModal() {
    setSelectedSlot(null)
    setShowCreateModal(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Calendário</h2>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          + Novo Evento
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 fc-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ptBrLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          events={events}
          selectable
          selectMirror
          dayMaxEvents
          weekends
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
          eventDisplay="block"
        />
      </div>

      {showCreateModal && (
        <EventModal
          slot={selectedSlot}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          currentProfileId={profile?.id}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
