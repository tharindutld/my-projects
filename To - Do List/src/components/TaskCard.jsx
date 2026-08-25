import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Star, 
  Pin, 
  Calendar, 
  CheckSquare, 
  Trash2, 
  Edit3,
  Clock
} from 'lucide-react';

export default function TaskCard({
  task,
  onToggleStatus,
  onToggleStar,
  onTogglePin,
  onEdit,
  onDelete,
  onToggleSubtask
}) {
  const isCompleted = task.status === 'completed';
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        opacity: isCompleted ? 0.75 : 1,
        borderLeft: task.is_pinned ? '4px solid var(--accent-primary)' : undefined,
        position: 'relative'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
          {/* Checkbox Button */}
          <button
            onClick={() => onToggleStatus(task.id)}
            style={{
              color: isCompleted ? 'var(--status-completed)' : 'var(--text-muted)',
              marginTop: '2px',
              transition: 'transform 0.2s ease'
            }}
          >
            {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>

          <div style={{ flex: 1 }}>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: isCompleted ? 'line-through' : 'none',
                color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                marginBottom: '0.2rem'
              }}
            >
              {task.title}
            </h4>

            {task.description && (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Pin & Star Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <button
            className="btn-icon"
            onClick={() => onTogglePin(task.id, !task.is_pinned)}
            style={{ color: task.is_pinned ? 'var(--accent-primary)' : 'var(--text-muted)' }}
            title={task.is_pinned ? 'Unpin task' : 'Pin task'}
          >
            <Pin size={15} />
          </button>

          <button
            className="btn-icon"
            onClick={() => onToggleStar(task.id, !task.is_starred)}
            style={{ color: task.is_starred ? '#f59e0b' : 'var(--text-muted)' }}
            title={task.is_starred ? 'Unstar task' : 'Star task'}
          >
            <Star size={15} fill={task.is_starred ? '#f59e0b' : 'transparent'} />
          </button>
        </div>
      </div>

      {/* Subtasks Progress */}
      {subtasks.length > 0 && (
        <div style={{ background: 'var(--bg-tertiary)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckSquare size={13} />
              <span>Subtasks ({completedSubtasks}/{subtasks.length})</span>
            </div>
            <span>{Math.round((completedSubtasks / subtasks.length) * 100)}%</span>
          </div>

          <div style={{ height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(completedSubtasks / subtasks.length) * 100}%`,
                background: 'var(--accent-primary)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Badges & Meta Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Priority Badge */}
          <span className={`badge badge-${task.priority}`}>
            {task.priority}
          </span>

          {/* Category Tag */}
          {task.category_name && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-tertiary)',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: task.category_color || '#6366f1'
                }}
              />
              {task.category_name}
            </span>
          )}

          {/* Due Date Indicator */}
          {task.due_date && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: isOverdue ? '#ef4444' : 'var(--text-secondary)',
                background: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px'
              }}
            >
              {isOverdue ? <Clock size={13} /> : <Calendar size={13} />}
              {formatDate(task.due_date)}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <button className="btn-icon" onClick={() => onEdit(task)} title="Edit Task">
            <Edit3 size={15} />
          </button>

          <button className="btn-icon" onClick={() => onDelete(task.id)} title="Delete Task" style={{ color: '#ef4444' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
