import React, { useState, useRef, useEffect } from 'react';
import TaskCard from './TaskCard';
import { 
  ArrowUpDown, 
  ChevronDown,
  Check,
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
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  const SORT_OPTIONS = [
    { value: 'created', label: 'Date Added' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Title (A-Z)' },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* Custom Sort Dropdown */}
          <div className="custom-dropdown" ref={sortRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="custom-dropdown-btn"
              onClick={() => setIsSortOpen(!isSortOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--bg-tertiary)',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <ArrowUpDown size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>Sort: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}</span>
              <ChevronDown
                size={14}
                style={{
                  color: 'var(--text-secondary)',
                  transition: 'transform 0.2s ease',
                  transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {isSortOpen && (
              <div
                className="custom-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  zIndex: 50,
                  width: '180px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '0.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  animation: 'fadeIn 0.15s ease'
                }}
              >
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        setIsSortOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                        background: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                      className="custom-dropdown-item"
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
                    </button>
                  );
                })}
              </div>
            )}
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

          <div className="task-cards-grid">
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
          <div className="task-cards-grid">
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
