import { useCallback, useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const COLUMNS = [
  { id: 'a_fazer', label: 'A Fazer', color: 'border-t-slate-400' },
  { id: 'fazendo', label: 'Fazendo', color: 'border-t-amber-400' },
  { id: 'feito',   label: 'Feito',   color: 'border-t-green-400' },
]

const PRIORITY = {
  alta:  { label: 'Alta',  cls: 'bg-red-100 text-red-700' },
  media: { label: 'Média', cls: 'bg-amber-100 text-amber-700' },
  baixa: { label: 'Baixa', cls: 'bg-green-100 text-green-700' },
}

function fmt(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// ─── Task card (pure display) ───────────────────────────────────────────────
function TaskCard({ task, currentProfileId, onDelete, onMove, overlay = false }) {
  const isOwner = task.criador_id === currentProfileId
  const overdue  = task.prazo && new Date(task.prazo) < new Date() && task.status !== 'feito'
  const p = PRIORITY[task.prioridade] ?? PRIORITY.media

  return (
    <div
      className={`bg-white rounded-xl border p-3 shadow-sm select-none ${
        overlay ? 'rotate-1 shadow-xl opacity-95' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800 leading-snug">{task.titulo}</p>
        {isOwner && !overlay && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onDelete(task.id)}
            className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none -mt-0.5"
          >
            ×
          </button>
        )}
      </div>

      {task.descricao && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.descricao}</p>
      )}

      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.cls}`}>
          {p.label}
        </span>
        {task.prazo && (
          <span className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
            {overdue ? '⚠ ' : ''}{fmt(task.prazo)}
          </span>
        )}
      </div>

      {task.responsavel && (
        <div className="mt-2 flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: task.responsavel.cor ?? '#4f46e5' }}
          />
          <span className="text-xs text-gray-500">{task.responsavel.nome}</span>
        </div>
      )}

      {/* Botões de mover — visíveis só em mobile (ocultos em md+) */}
      {!overlay && onMove && (
        <div className="mt-2.5 pt-2 border-t border-gray-50 flex gap-1 md:hidden">
          {COLUMNS.map(col => (
            <button
              key={col.id}
              disabled={task.status === col.id}
              onPointerDown={e => e.stopPropagation()}
              onClick={() => onMove(task.id, col.id)}
              className={`flex-1 py-1 text-xs rounded-lg font-medium transition-colors ${
                task.status === col.id
                  ? 'bg-gray-50 text-gray-300 cursor-default'
                  : 'bg-indigo-50 text-indigo-600 active:bg-indigo-100'
              }`}
            >
              {col.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Draggable wrapper ───────────────────────────────────────────────────────
function DraggableCard({ task, currentProfileId, onDelete, onMove }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? 'opacity-0' : ''}
    >
      <TaskCard task={task} currentProfileId={currentProfileId} onDelete={onDelete} onMove={onMove} />
    </div>
  )
}

// ─── Droppable column ────────────────────────────────────────────────────────
function KanbanColumn({ column, tasks, currentProfileId, onDelete, onMove }) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-gray-50 rounded-2xl border border-gray-100 border-t-4 ${column.color} transition-shadow ${
        isOver ? 'ring-2 ring-indigo-300 shadow-md' : ''
      }`}
    >
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600">{column.label}</h3>
        <span className="text-xs bg-white border border-gray-200 text-gray-400 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 px-3 pb-3 space-y-2 min-h-28">
        {tasks.map(task => (
          <DraggableCard
            key={task.id}
            task={task}
            currentProfileId={currentProfileId}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Task creation modal ─────────────────────────────────────────────────────
function TaskModal({ profiles, currentProfileId, onClose, onSave }) {
  const [titulo,        setTitulo]        = useState('')
  const [descricao,     setDescricao]     = useState('')
  const [responsavelId, setResponsavelId] = useState(currentProfileId ?? '')
  const [prazo,         setPrazo]         = useState('')
  const [prioridade,    setPrioridade]    = useState('media')
  const [tipo,          setTipo]          = useState('casa')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) return setError('Título é obrigatório.')
    setSaving(true)
    setError('')
    try {
      await onSave({ titulo, descricao, responsavel_id: responsavelId, prazo: prazo || null, prioridade, tipo })
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
        <h3 className="text-lg font-semibold text-gray-800 mb-5">Nova Tarefa</h3>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="O que precisa ser feito?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              rows={2}
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Detalhes opcionais..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={responsavelId}
                onChange={e => setResponsavelId(e.target.value)}
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={prazo}
                onChange={e => setPrazo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={prioridade}
                onChange={e => setPrioridade(e.target.value)}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={tipo}
                onChange={e => setTipo(e.target.value)}
              >
                <option value="casa">Casa (todos veem)</option>
                <option value="pessoal">Pessoal (só eu)</option>
              </select>
            </div>
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
              {saving ? 'Salvando...' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'todas',  label: 'Todas' },
  { id: 'minhas', label: 'Minhas' },
  { id: 'casa',   label: 'Da Casa' },
]

const COLUMN_IDS = new Set(COLUMNS.map(c => c.id))

export default function Tarefas() {
  const { profile } = useAuth()
  const [tasks,      setTasks]      = useState([])
  const [profiles,   setProfiles]   = useState([])
  const [activeTask, setActiveTask] = useState(null)
  const [showModal,  setShowModal]  = useState(false)
  const [filter,     setFilter]     = useState('todas')
  const [loading,    setLoading]    = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, responsavel:profiles!responsavel_id(nome, cor), criador:profiles!criador_id(nome, cor)')
      .order('criado_em', { ascending: false })
    if (error) { console.error(error.message); return }
    setTasks(data ?? [])
  }, [])

  useEffect(() => {
    async function init() {
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*, responsavel:profiles!responsavel_id(nome, cor), criador:profiles!criador_id(nome, cor)')
          .order('criado_em', { ascending: false }),
        supabase.from('profiles').select('id, nome, cor').order('nome'),
      ])
      setTasks(t ?? [])
      setProfiles(p ?? [])
      setLoading(false)
    }
    init()

    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchTasks])

  const filtered = tasks.filter(t => {
    if (filter === 'minhas') return t.responsavel_id === profile?.id
    if (filter === 'casa')   return t.tipo === 'casa'
    return true
  })

  const byStatus = Object.fromEntries(
    COLUMNS.map(col => [col.id, filtered.filter(t => t.status === col.id)])
  )

  function getStatus(taskId) {
    return tasks.find(t => t.id === taskId)?.status ?? null
  }

  function handleDragStart({ active }) {
    setActiveTask(tasks.find(t => t.id === active.id) ?? null)
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null)
    if (!over) return

    const from = getStatus(active.id)
    const to   = COLUMN_IDS.has(over.id) ? over.id : getStatus(over.id)

    if (!from || !to || from === to) return

    setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: to } : t))
    supabase.from('tasks').update({ status: to }).eq('id', active.id)
  }

  async function handleCreate({ titulo, descricao, responsavel_id, prazo, prioridade, tipo }) {
    if (!profile?.id) throw new Error('Perfil não carregado.')
    const { error } = await supabase.from('tasks').insert({
      titulo,
      descricao:     descricao || null,
      responsavel_id,
      criador_id:    profile.id,
      prazo:         prazo ? new Date(prazo + 'T23:59:59').toISOString() : null,
      prioridade,
      tipo,
      status:        'a_fazer',
    })
    if (error) throw new Error(error.message)
    await fetchTasks()
  }

  async function handleDelete(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  function handleMove(taskId, newStatus) {
    const current = tasks.find(t => t.id === taskId)?.status
    if (!current || current === newStatus) return
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Tarefas</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden text-sm">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 transition-colors ${
                  filter === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            + Nova Tarefa
          </button>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={byStatus[col.id] ?? []}
                currentProfileId={profile?.id}
                onDelete={handleDelete}
                onMove={handleMove}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask && (
              <TaskCard task={activeTask} currentProfileId={profile?.id} overlay />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {showModal && (
        <TaskModal
          profiles={profiles}
          currentProfileId={profile?.id}
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  )
}
