import React, { useState } from 'react';
import { 
  Inbox, 
  Calendar, 
  Clock, 
  Star, 
  CheckCircle2, 
  FolderPlus, 
  Zap,
  Tag,
  AlertCircle,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

export default function Sidebar({
  activeFilter,
  setActiveFilter,
  categories,
  tasks = [],
  selectedCategory,
  setSelectedCategory,
  onOpenCategoryModal,
  onDeleteCategory,
  taskStats
}) {
  const [confirmingCategory, setConfirmingCategory] = useState(null);

  const getTaskCountForCategory = (catId) => {
    return tasks.filter((t) => String(t.category_id) === String(catId)).length;
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand-logo">
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Zap size={20} />
        </div>
        <span>TaskPulse</span>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', paddingLeft: '0.85rem', marginBottom: '0.25rem' }}>
          Overview
        </div>

        <button
          className={`nav-item ${activeFilter === 'all' && !selectedCategory ? 'active' : ''}`}
          onClick={() => { setActiveFilter('all'); setSelectedCategory(null); }}
        >
          <div className="nav-item-left">
            <Inbox size={18} />
            <span>All Tasks</span>
          </div>
          <span className="count-pill">{taskStats.total}</span>
        </button>

        <button
          className={`nav-item ${activeFilter === 'today' && !selectedCategory ? 'active' : ''}`}
          onClick={() => { setActiveFilter('today'); setSelectedCategory(null); }}
        >
          <div className="nav-item-left">
            <Calendar size={18} />
            <span>Today</span>
          </div>
          <span className="count-pill">{taskStats.today}</span>
        </button>

        <button
          className={`nav-item ${activeFilter === 'upcoming' && !selectedCategory ? 'active' : ''}`}
          onClick={() => { setActiveFilter('upcoming'); setSelectedCategory(null); }}
        >
          <div className="nav-item-left">
            <Clock size={18} />
            <span>Upcoming</span>
          </div>
          <span className="count-pill">{taskStats.upcoming}</span>
        </button>

        <button
          className={`nav-item ${activeFilter === 'urgent' && !selectedCategory ? 'active' : ''}`}
          onClick={() => { setActiveFilter('urgent'); setSelectedCategory(null); }}
        >
          <div className="nav-item-left">
            <AlertCircle size={18} style={{ color: 'var(--priority-urgent)' }} />
            <span>Urgent</span>
          </div>
          <span className="count-pill" style={{ color: 'var(--priority-urgent)' }}>{taskStats.urgent}</span>
        </button>

        <button
          className={`nav-item ${activeFilter === 'starred' && !selectedCategory ? 'active' : ''}`}
          onClick={() => { setActiveFilter('starred'); setSelectedCategory(null); }}
        >
          <div className="nav-item-left">
            <Star size={18} style={{ color: '#f59e0b' }} />
            <span>Starred</span>
          </div>
          <span className="count-pill">{taskStats.starred}</span>
        </button>

        <button
          className={`nav-item ${activeFilter === 'completed' && !selectedCategory ? 'active' : ''}`}
          onClick={() => { setActiveFilter('completed'); setSelectedCategory(null); }}
        >
          <div className="nav-item-left">
            <CheckCircle2 size={18} style={{ color: 'var(--status-completed)' }} />
            <span>Completed</span>
          </div>
          <span className="count-pill">{taskStats.completed}</span>
        </button>
      </nav>

      {/* Projects / Categories Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '0.85rem', paddingRight: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Projects / Tags
          </span>
          <button className="btn-icon" onClick={onOpenCategoryModal} title="Add Custom Category">
            <FolderPlus size={16} />
          </button>
        </div>

        <div className="sidebar-nav">
          {categories.map((cat) => {
            const isSelected = selectedCategory === String(cat.id);
            const count = getTaskCountForCategory(cat.id);

            return (
              <div
                key={cat.id}
                className={`nav-item ${isSelected ? 'active' : ''}`}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', group: 'category-item' }}
                onClick={() => setSelectedCategory(String(cat.id))}
              >
                <div className="nav-item-left">
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: cat.color || '#6366f1'
                    }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                    {cat.name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {count > 0 && <span className="count-pill">{count}</span>}
                  <button
                    type="button"
                    className="btn-icon"
                    title={`Delete ${cat.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmingCategory(cat);
                    }}
                    style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Metric Card */}
      <div className="glass-panel" style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
          Completion Rate
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{taskStats.completionRate}%</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{taskStats.completed}/{taskStats.total} Done</span>
        </div>
        <div style={{ height: '6px', width: '100%', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${taskStats.completionRate}%`,
              background: 'var(--accent-gradient)',
              borderRadius: '3px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Delete Category Confirmation Modal */}
      {confirmingCategory && (
        <div className="modal-overlay" onClick={() => setConfirmingCategory(null)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} />
                <span>Delete Project Tag?</span>
              </h3>
              <button className="btn-icon" onClick={() => setConfirmingCategory(null)}>
                <X size={18} />
              </button>
            </div>

            {getTaskCountForCategory(confirmingCategory.id) > 0 ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                ⚠️ The project tag <strong>"{confirmingCategory.name}"</strong> currently has <strong>{getTaskCountForCategory(confirmingCategory.id)} task(s)</strong> assigned to it.
                <br /><br />
                Are you sure you want to delete this project tag? (Tasks will remain intact, but will no longer have a project tag).
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Are you sure you want to delete the project tag <strong>"{confirmingCategory.name}"</strong>?
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmingCategory(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#ef4444', color: 'white' }}
                onClick={async (e) => {
                  e.stopPropagation();
                  const targetId = confirmingCategory.id;
                  setConfirmingCategory(null);
                  if (onDeleteCategory) {
                    await onDeleteCategory(targetId);
                  }
                }}
              >
                Delete Project Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
