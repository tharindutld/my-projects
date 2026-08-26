import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Tag, AlertCircle, CheckSquare, Star, Pin } from 'lucide-react';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TaskModal({ isOpen, onClose, onSave, task, categories }) {
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [categoryId, setCategoryId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueDateError, setDueDateError] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  const todayStr = getTodayString();

  useEffect(() => {
    setTitleError('');
    setDueDateError('');
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'todo');
      setCategoryId(task.category_id ? String(task.category_id) : '');
      setDueDate(task.due_date ? task.due_date.substring(0, 10) : '');
      setIsStarred(!!task.is_starred);
      setIsPinned(!!task.is_pinned);
      setSubtasks(task.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setCategoryId(categories[0] ? String(categories[0].id) : '');
      setDueDate('');
      setIsStarred(false);
      setIsPinned(false);
      setSubtasks([]);
    }
  }, [task, isOpen, categories]);

  if (!isOpen) return null;

  const validateTitle = (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Task title is required.';
    }
    if (trimmed.length < 3) {
      return 'Task title must be at least 3 characters long.';
    }
    if (trimmed.length > 255) {
      return 'Task title cannot exceed 255 characters.';
    }
    if (!/[A-Za-z]/.test(trimmed)) {
      return 'Task title must contain letters (cannot be only numbers or special characters).';
    }
    const validCharsRegex = /^[A-Za-z0-9\s]+$/;
    if (!validCharsRegex.test(trimmed)) {
      return 'Task title can only contain letters, numbers, and spaces (no special characters, minus, or plus).';
    }
    return '';
  };

  const validateDueDate = (val) => {
    if (val && val < todayStr) {
      return 'Due date cannot be a past date.';
    }
    return '';
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    setTitleError(validateTitle(val));
  };

  const handleDueDateChange = (e) => {
    const val = e.target.value;
    setDueDate(val);
    setDueDateError(validateDueDate(val));
  };

  const handleAddSubtask = () => {
    if (newSubtaskInput.trim() !== '') {
      setSubtasks([...subtasks, { id: Date.now(), title: newSubtaskInput.trim(), completed: false }]);
      setNewSubtaskInput('');
    }
  };

  const handleRemoveSubtask = (idx) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const tErr = validateTitle(title);
    const dErr = validateDueDate(dueDate);

    setTitleError(tErr);
    setDueDateError(dErr);

    if (tErr || dErr) {
      return;
    }

    onSave({
      id: task ? task.id : undefined,
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      category_id: categoryId || null,
      due_date: dueDate || null,
      is_starred: isStarred ? 1 : 0,
      is_pinned: isPinned ? 1 : 0,
      subtasks
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800 }}>
            {task ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="What needs to be accomplished?"
              value={title}
              onChange={handleTitleChange}
              style={{ border: titleError ? '1px solid #ef4444' : undefined }}
              autoFocus
            />
            {titleError && (
              <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block', fontWeight: 500 }}>
                ⚠️ {titleError}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description / Notes</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Add extra details, markdown links, or requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Row 1: Priority & Category */}
          <div className="modal-form-grid">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority 🔥</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Project / Tag</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">No Project Tag</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Status & Due Date */}
          <div className="modal-form-grid">
            <div className="form-group">
              <label className="form-label">Status Stage</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Under Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                min={todayStr}
                value={dueDate}
                onChange={handleDueDateChange}
                style={{ border: dueDateError ? '1px solid #ef4444' : undefined }}
              />
              {dueDateError && (
                <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block', fontWeight: 500 }}>
                  ⚠️ {dueDateError}
                </span>
              )}
            </div>
          </div>

          {/* Subtasks Builder */}
          <div className="form-group">
            <label className="form-label">Subtasks & Checklist</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Add subtask step..."
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
              />
              <button type="button" className="btn btn-secondary" onClick={handleAddSubtask}>
                <Plus size={16} />
              </button>
            </div>

            {subtasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                {subtasks.map((st, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <span style={{ textDecoration: st.completed ? 'line-through' : 'none', color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {st.title}
                    </span>
                    <button type="button" className="btn-icon" onClick={() => handleRemoveSubtask(i)} style={{ color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Star & Pin Options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '1rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isStarred}
                onChange={(e) => setIsStarred(e.target.checked)}
              />
              <Star size={16} style={{ color: '#f59e0b' }} />
              <span>Mark as Starred</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              <Pin size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>Pin to Top</span>
            </label>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
