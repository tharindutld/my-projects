import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { 
  ArrowUpDown, 
  CheckSquare, 
  Trash2, 
  Plus, 
  Pin,
  Sparkles
} from 'lucide-react';

export default function ListView({
  tasks,
  categories,
  selectedCategory,
  onToggleStatus,
  onToggleStar,
  onTogglePin,
  onEdit,
  onDelete,
  onNewTask
}) {
  const [sortBy, setSortBy] = useState('created'); // 'created', 'dueDate', 'priority', 'title'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'todo', 'in_progress', 'completed'

  // Filter tasks
  let filtered = tasks.filter((t) => {
    if (statusFilter === 'todo') return t.status === 'todo';
    if (statusFilter === 'in_progress') return t.status === 'in_progress';
    if (statusFilter === 'completed') return t.status === 'completed';
    return true;
  });

  // Sort tasks
  filtered.sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    }
    if (sortBy === 'priority') {
      const order = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (order[b.priority] || 0) - (order[a.priority] || 0);
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return new Date(b.created_at || b.id) - new Date(a.created_at || a.id);
  });

  const pinnedTasks = filtered.filter((t) => t.is_pinned);
  const unpinnedTasks = filtered.filter((t) => !t.is_pinned);

  const selectedCategoryObj = categories.find((c) => String(c.id) === String(selectedCategory));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* List Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {selectedCategoryObj ? (
              <>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: selectedCategoryObj.color }} />
                {selectedCategoryObj.name}
              </>
            ) : (
              'Task Overview'
            )}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'} found
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Status Sub-filter */}
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '0.2rem', borderRadius: '8px', gap: '0.2rem' }}>
            {['all', 'todo', 'in_progress', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  background: statusFilter === st ? 'var(--accent-primary)' : 'transparent',
                  color: statusFilter === st ? 'white' : 'var(--text-secondary)',
                  textTransform: 'capitalize'
                }}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-tertiary)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <ArrowUpDown size={14} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ background: 'transparent', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="created">Sort: Date Added</option>
              <option value="dueDate">Sort: Due Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="title">Sort: Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pinned Tasks Section */}
      {pinnedTasks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
            <Pin size={15} />
            <span>Pinned Tasks ({pinnedTasks.length})</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {pinnedTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onToggleStatus={onToggleStatus}
                onToggleStar={onToggleStar}
                onTogglePin={onTogglePin}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* All / Regular Tasks Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {pinnedTasks.length > 0 && unpinnedTasks.length > 0 && (
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.5rem' }}>
            Other Tasks ({unpinnedTasks.length})
          </div>
        )}

        {filtered.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '4rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '1.25rem'
            }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <Sparkles size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>No Tasks Found</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '360px' }}>
                You have completed all pending tasks or no items match your current filter settings.
              </p>
            </div>
            <button className="btn btn-primary" onClick={onNewTask}>
              <Plus size={18} />
              <span>Create New Task</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {unpinnedTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onToggleStatus={onToggleStatus}
                onToggleStar={onToggleStar}
                onTogglePin={onTogglePin}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
