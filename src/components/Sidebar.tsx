import { useState } from 'react'
import { Menu, Plus, Pencil, Trash2, Layout, Folder, Tag as TagIcon } from 'lucide-react'
import { PrivacyText } from './PrivacyText'
import { useNotesStore } from '../store/notesStore'
import { useTagsStore } from '../store/tagsStore'
import { useUiStore } from '../store/uiStore'
import type { Group } from '../types/group'
import type { Tag } from '../types/tag'

const GROUP_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#94a3b8',
]

type EditState =
  | { mode: 'idle' }
  | { mode: 'edit'; groupId: number; name: string; color: string }
  | { mode: 'create'; parentId: number | null; name: string; color: string }

type SidebarProps = {
  groups: Group[]
  selectedGroupId: number | null
  ungroupedNotesCount: number
  collapsed?: boolean
  onSelectGroup: (groupId: number | null) => void
  selectedTagId?: number | null
  onSelectTag?: (tagId: number | null) => void
}

function getGroupNotesCount(group: Group): number {
  return (group.notes?.length ?? 0) + group.children.reduce((total, child) => total + getGroupNotesCount(child), 0)
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {GROUP_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`h-3.5 w-3.5 rounded-full transition ${value === c ? 'ring-2 ring-slate-400 dark:ring-cyan-400 ring-offset-1 dark:ring-offset-obsidian' : 'opacity-60 hover:opacity-100'}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

function InlineForm({
  name, color, placeholder, onChangeName, onChangeColor, onSave, onCancel,
}: {
  name: string
  color: string
  placeholder?: string
  onChangeName: (n: string) => void
  onChangeColor: (c: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:bg-obsidian-light dark:border-white/10">
      <input
        autoFocus
        value={name}
        onChange={(e) => onChangeName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
        placeholder={placeholder ?? 'Nombre del grupo'}
        className="w-full rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-500 dark:bg-void dark:border-white/10 dark:focus:border-cyan-400 dark:text-white"
      />
      <ColorPicker value={color} onChange={onChangeColor} />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onSave}
          className="rounded bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 dark:text-void"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

type GroupNodeProps = {
  group: Group
  selectedGroupId: number | null
  editState: EditState
  collapsedGroups: Set<number>
  sidebarCollapsed: boolean
  onSelectGroup: (groupId: number | null) => void
  onToggleCollapse: (groupId: number) => void
  onStartEdit: (group: Group) => void
  onStartCreate: (parentId: number) => void
  onDelete: (group: Group) => void
  onSave: () => void
  onCancel: () => void
  onChangeName: (name: string) => void
  onChangeColor: (color: string) => void
  depth?: number
}

function GroupNode({
  group, selectedGroupId, editState, collapsedGroups, onSelectGroup, onToggleCollapse,
  sidebarCollapsed, onStartEdit, onStartCreate, onDelete, onSave, onCancel, onChangeName, onChangeColor, depth = 0,
}: GroupNodeProps) {
  const selected = selectedGroupId === group.id
  const isEditing = editState.mode === 'edit' && editState.groupId === group.id
  const isCreatingChild = editState.mode === 'create' && editState.parentId === group.id
  const hasChildren = group.children.length > 0
  const collapsed = collapsedGroups.has(group.id)
  const noteCount = getGroupNotesCount(group)

  return (
    <div>
      {isEditing && !sidebarCollapsed ? (
        <div className="py-0.5 pr-1" style={{ paddingLeft: `${8 + depth * 12}px` }}>
          <InlineForm
            name={editState.name}
            color={editState.color}
            onChangeName={onChangeName}
            onChangeColor={onChangeColor}
            onSave={onSave}
            onCancel={onCancel}
          />
        </div>
      ) : (
        <div className={`group/node flex items-center gap-0.5 ${sidebarCollapsed ? 'justify-center px-2' : 'pr-1'}`} style={sidebarCollapsed ? undefined : { paddingLeft: `${4 + depth * 12}px` }}>
          {hasChildren && !sidebarCollapsed ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(group.id) }}
              className="shrink-0 rounded p-0.5 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-cyan-400"
            >
              <svg
                className={`h-3 w-3 transition-transform ${collapsed ? '' : 'rotate-90'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
              </svg>
            </button>
          ) : !sidebarCollapsed ? (
            <span className="w-4 shrink-0" />
          ) : null}

          <button
            type="button"
            onClick={() => onSelectGroup(group.id)}
            title={group.name}
            aria-label={`Seleccionar grupo ${group.name}`}
            className={`flex min-w-0 items-center rounded-md text-left transition ${sidebarCollapsed ? 'h-9 w-9 justify-center px-0 py-0' : 'flex-1 justify-between px-2 py-1'} ${
              selected
                ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-cyan-950/30 dark:text-cyan-400 border-l-2 border-blue-600 dark:border-cyan-400 rounded-l-none'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
            }`}
          >
            <span className={`flex min-w-0 items-center ${sidebarCollapsed ? 'justify-center' : 'gap-1.5'}`}>
              <span
                className={`${sidebarCollapsed ? 'h-3 w-3' : 'h-2 w-2'} shrink-0 rounded-full transition-transform ${selected ? 'scale-125' : ''}`}
                style={{ backgroundColor: group.color ?? '#94a3b8' }}
              />
              {!sidebarCollapsed && <span className="truncate text-xs">
                <PrivacyText fallback="Grupo privado">{group.name}</PrivacyText>
              </span>}
            </span>
            {!sidebarCollapsed && (
              <span className={`ml-1.5 shrink-0 text-[10px] ${selected ? 'text-blue-400 dark:text-cyan-400/80' : 'text-slate-400'}`}>
                {noteCount}
              </span>
            )}
          </button>

          {!sidebarCollapsed && <div className="flex shrink-0 gap-0.5 lg:invisible lg:group-hover/node:visible lg:group-focus-within/node:visible">
            <button
              type="button"
              title="Agregar subgrupo"
              onClick={() => onStartCreate(group.id)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-cyan-400"
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              title="Editar"
              onClick={() => onStartEdit(group)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-cyan-400"
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              title="Eliminar"
              onClick={() => onDelete(group)}
              className="rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            >
              <Trash2 size={12} />
            </button>
          </div>}
        </div>
      )}

      {isCreatingChild && !sidebarCollapsed && (
        <div className="py-0.5 pr-1" style={{ paddingLeft: `${8 + (depth + 1) * 12}px` }}>
          <InlineForm
            name={editState.name}
            color={editState.color}
            placeholder="Nombre del subgrupo"
            onChangeName={onChangeName}
            onChangeColor={onChangeColor}
            onSave={onSave}
            onCancel={onCancel}
          />
        </div>
      )}

      {!collapsed && group.children.map((child) => (
        <GroupNode
          key={child.id}
          group={child}
          selectedGroupId={selectedGroupId}
          editState={editState}
          collapsedGroups={collapsedGroups}
          sidebarCollapsed={sidebarCollapsed}
          onSelectGroup={onSelectGroup}
          onToggleCollapse={onToggleCollapse}
          onStartEdit={onStartEdit}
          onStartCreate={onStartCreate}
          onDelete={onDelete}
          onSave={onSave}
          onCancel={onCancel}
          onChangeName={onChangeName}
          onChangeColor={onChangeColor}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

export function Sidebar({ groups, selectedGroupId, ungroupedNotesCount, collapsed = false, onSelectGroup, selectedTagId, onSelectTag }: SidebarProps) {
  const createGroup = useNotesStore((state) => state.createGroup)
  const updateGroup = useNotesStore((state) => state.updateGroup)
  const deleteGroup = useNotesStore((state) => state.deleteGroup)
  const tags = useTagsStore((state) => state.tags)
  const saveTag = useTagsStore((state) => state.saveTag)
  const removeTag = useTagsStore((state) => state.removeTag)

  const [editState, setEditState] = useState<EditState>({ mode: 'idle' })
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set())
  const [tagEditName, setTagEditName] = useState('')
  const [tagEditingId, setTagEditingId] = useState<number | null>(null)
  function toggleCollapse(groupId: number) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const isCreatingRoot = editState.mode === 'create' && editState.parentId === null

  function startEdit(group: Group) {
    if (collapsed) return
    setEditState({ mode: 'edit', groupId: group.id, name: group.name, color: group.color ?? GROUP_COLORS[0] })
  }

  function startCreate(parentId: number | null) {
    if (collapsed) return
    setEditState({ mode: 'create', parentId, name: '', color: GROUP_COLORS[0] })
  }

  function handleChangeName(name: string) {
    if (editState.mode !== 'idle') setEditState({ ...editState, name })
  }

  function handleChangeColor(color: string) {
    if (editState.mode !== 'idle') setEditState({ ...editState, color })
  }

  function handleCancel() {
    setEditState({ mode: 'idle' })
  }

  async function handleSave() {
    if (editState.mode === 'edit') {
      await updateGroup(editState.groupId, { name: editState.name.trim(), color: editState.color })
    } else if (editState.mode === 'create' && editState.name.trim()) {
      await createGroup({ name: editState.name.trim(), color: editState.color, parentId: editState.parentId })
    }
    setEditState({ mode: 'idle' })
  }

  async function handleDelete(group: Group) {
    if (!window.confirm(`¿Eliminar el grupo "${group.name}"? Las notas quedarán sin grupo.`)) return
    await deleteGroup(group.id)
  }

  async function handleSaveTag(id?: number) {
    if (!tagEditName.trim()) return
    await saveTag({ name: tagEditName.trim() }, id)
    setTagEditName('')
    setTagEditingId(null)
  }

  async function handleDeleteTag(tag: Tag) {
    if (!window.confirm(`¿Eliminar la etiqueta "${tag.name}"?`)) return
    await removeTag(tag.id)
  }

  const toggleSidebarCollapsed = useUiStore((state) => state.toggleSidebarCollapsed)
  const theme = useUiStore((state) => state.theme)

  const borderClass = theme === 'dark' ? 'border-white/5' : 'border-slate-200'

  return (
    <aside data-sidebar="true" className={`flex h-full flex-col overflow-hidden border-r ${borderClass} bg-white dark:bg-obsidian/95 dark:backdrop-blur-md transition-all duration-200`}>
      <div className={`flex shrink-0 items-center border-b border-slate-100 dark:border-white/5 py-2 ${collapsed ? 'flex-col justify-center gap-1.5 px-2' : 'gap-2 px-3'}`}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 text-xs font-black text-white dark:text-void shadow-sm dark:shadow-[0_0_10px_rgba(0,240,255,0.4)]">
          N
        </span>
        {!collapsed && <span className="text-sm font-bold text-slate-800 dark:text-cyan-400 font-sans tracking-wide">Neural Notes</span>}
        {!collapsed && <div className="flex-1" />}
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          className="hidden lg:flex rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:text-cyan-400 dark:hover:bg-white/5"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <Menu size={16} />
        </button>
      </div>

      <nav className={`flex flex-1 flex-col gap-0.5 overflow-y-auto py-2.5 ${collapsed ? 'items-center px-1' : 'px-2'}`}>
        <button
          type="button"
          onClick={() => onSelectGroup(null)}
          title="Todas las notas"
          className={`flex items-center rounded-lg text-left text-xs font-medium transition-all ${
            collapsed
              ? 'h-9 w-9 justify-center px-0 py-0 hover:bg-slate-100 dark:hover:bg-white/5'
              : 'w-full gap-2.5 px-2.5 py-2'
          } ${
            selectedGroupId === null
              ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-cyan-950/30 dark:text-cyan-400 border-l-2 border-blue-600 dark:border-cyan-400 rounded-l-none'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
          }`}
        >
          <Layout size={collapsed ? 16 : 14} className="shrink-0 opacity-70" />
          {!collapsed && <span className="flex-1">Todas las notas</span>}
        </button>

        <div className={`mt-1 flex items-center gap-1 pb-px pt-2 ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
          {!collapsed && <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
            <Folder size={11} />
            Grupos
          </div>}
          <button
            type="button"
            title="Nuevo grupo"
            onClick={() => startCreate(null)}
            className={`rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-cyan-400 ${collapsed ? 'p-1.5' : 'p-0.5'}`}
            disabled={collapsed}
          >
            <Plus size={12} />
          </button>
        </div>

        {groups.map((group) => (
          <GroupNode
            key={group.id}
            group={group}
            selectedGroupId={selectedGroupId}
            editState={editState}
            collapsedGroups={collapsedGroups}
            sidebarCollapsed={collapsed}
            onSelectGroup={onSelectGroup}
            onToggleCollapse={toggleCollapse}
            onStartEdit={startEdit}
            onStartCreate={startCreate}
            onDelete={handleDelete}
            onSave={handleSave}
            onCancel={handleCancel}
            onChangeName={handleChangeName}
            onChangeColor={handleChangeColor}
          />
        ))}

        {isCreatingRoot && !collapsed && (
          <div className="px-1 py-0.5">
            <InlineForm
              name={editState.name}
              color={editState.color}
              onChangeName={handleChangeName}
              onChangeColor={handleChangeColor}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        )}

        {ungroupedNotesCount > 0 && !collapsed && (
          <button
            type="button"
            onClick={() => onSelectGroup(-1)}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-all ${
              selectedGroupId === -1
                ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-cyan-950/30 dark:text-cyan-400 border-l-2 border-blue-600 dark:border-cyan-400 rounded-l-none'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
            }`}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-white/20" />
            Sin grupo · <span className="font-semibold">{ungroupedNotesCount}</span>
          </button>
        )}

        {!collapsed && (
          <>
            <div className="mt-1 flex items-center gap-1.5 px-2 pb-px pt-2">
              <TagIcon size={11} className="text-slate-400 dark:text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">Etiquetas</span>
            </div>
            {tags.map((tag) => (
              <div key={tag.id} className="group/tag flex items-center gap-0.5 pr-1" style={{ paddingLeft: '4px' }}>
                {tagEditingId === tag.id ? (
                  <div className="flex flex-1 items-center gap-1 py-0.5">
                    <input
                      autoFocus
                      value={tagEditName}
                      onChange={(e) => setTagEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleSaveTag(tag.id)
                        if (e.key === 'Escape') { setTagEditingId(null); setTagEditName('') }
                      }}
                      className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 dark:bg-void dark:border-white/10 dark:text-white"
                    />
                    <button type="button" onClick={() => void handleSaveTag(tag.id)} className="rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-blue-700 dark:bg-cyan-500 dark:text-void dark:hover:bg-cyan-600">Guardar</button>
                    <button type="button" onClick={() => { setTagEditingId(null); setTagEditName('') }} className="rounded-lg px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelectTag?.(selectedTagId === tag.id ? null : tag.id)}
                      className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-1 text-left text-xs transition-all ${
                        selectedTagId === tag.id
                          ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-cyan-950/30 dark:text-cyan-400 border-l-2 border-blue-600 dark:border-cyan-400 rounded-l-none'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                      }`}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color ?? '#94a3b8' }} />
                      <PrivacyText fallback="Etiqueta">{tag.name}</PrivacyText>
                    </button>
                    <div className="flex shrink-0 gap-0.5 lg:invisible lg:group-hover/tag:visible lg:group-focus-within/tag:visible">
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => { setTagEditingId(tag.id); setTagEditName(tag.name) }}
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-white"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        onClick={() => void handleDeleteTag(tag)}
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}
      </nav>
      <div className={`shrink-0 border-t border-slate-100 dark:border-white/5 px-3 py-2 text-[10px] font-semibold text-slate-400 dark:text-slate-600 ${collapsed ? 'text-center' : ''} font-mono`}>
        {collapsed ? `v${__APP_VERSION__}` : `Notas v${__APP_VERSION__} · ${__APP_COMMIT__}`}
      </div>
    </aside>
  )
}
