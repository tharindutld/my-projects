import React from 'react';
import TaskCard from './TaskCard';
import { 
  Circle, 
  PlayCircle, 
  Eye, 
  CheckCircle2, 
  Plus,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'To Do', icon: Circle, color: 'var(--status-todo)' },
  { id: 'in_progress', title: 'In Progress', icon: PlayCircle, color: 'var(--status-inprogress)' },
  { id: 'review', title: 'Under Review', icon: Eye, color: 'var(--status-review)' },
  { id: 'completed', title: 'Completed', icon: CheckCircle2, color: 'var(--status-completed)' }
];

export default function KanbanBoard({
  tasks,
  onToggleStatus,
  onToggleStar,
  onTogglePin,
  onEdit,
  onDelete,
  onUpdateTaskStatus,
  onNewTask
}) {
  const getNextStatus = (currentStatus) => {
    if (currentStatus === 'todo') return 'in_progress';
    if (currentStatus === 'in_progress') return 'review';
    if (currentStatus === 'review') return 'completed';
    return 'todo';
  };

  const getPrevStatus = (currentStatus) => {
    if (currentStatus === 'completed') return 'review';
    if (currentStatus === 'review') return 'in_progress';
    if (currentStatus === 'in_progress') return 'todo';
    return 'completed';
  };

  return (
    <div className="kanban-grid">
      {COLUMNS.map((col) => {
        const Icon = col.icon;
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div key={col.id} className="kanban-column">
            {/* Column Header */}
            <div className="column-header">
              <div className="column-title">
                <Icon size={18} style={{ color: col.color }} />
                <span>{col.title}</span>
                <span className="count-pill">{colTasks.length}</span>
              </div>

              <button className="btn-icon" onClick={onNewTask} title={`Add task to ${col.title}`}>
                <Plus size={16} />
              </button>
            </div>

            {/* Column Cards */}
            <div className="column-tasks">
              {colTasks.length === 0 ? (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    border: '2px dashed var(--border-color)',
                    borderRadius: '12px',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem'
                  }}
                >
                  No tasks in {col.title.toLowerCase()}
                </div>
              ) : (
                colTasks.map((t) => (
                  <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <TaskCard
                      task={t}
                      onToggleStatus={onToggleStatus}
                      onToggleStar={onToggleStar}
                      onTogglePin={onTogglePin}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />

                    {/* Quick Move Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                      <button
                        className="btn-icon"
                        onClick={() => onUpdateTaskStatus(t.id, getPrevStatus(t.status))}
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--text-muted)' }}
                        title="Move to previous stage"
                      >
                        <ArrowLeft size={12} />
                        <span>Move Back</span>
                      </button>

                      <button
                        className="btn-icon"
                        onClick={() => onUpdateTaskStatus(t.id, getNextStatus(t.status))}
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--accent-primary)', fontWeight: 600 }}
                        title="Advance to next stage"
                      >
                        <span>Advance</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
