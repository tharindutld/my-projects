import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

export default function CalendarView({ tasks, onEdit }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar matrix calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = [];
  const prevDaysCount = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevMonthDays.push(prevDaysCount - i);
  }

  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  // Map tasks to days
  const tasksByDay = {};
  tasks.forEach((t) => {
    if (t.due_date) {
      const d = new Date(t.due_date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const dayNum = d.getDate();
        if (!tasksByDay[dayNum]) tasksByDay[dayNum] = [];
        tasksByDay[dayNum].push(t);
      }
    }
  });

  const isToday = (day) => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Calendar Header Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CalendarIcon size={22} className="text-indigo-400" />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800 }}>
            {monthNames[month]} {year}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={today} style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>
            Today
          </button>
          <button className="btn-icon" onClick={prevMonth}>
            <ChevronLeft size={20} />
          </button>
          <button className="btn-icon" onClick={nextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        {/* Days of week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
        </div>

        {/* Days Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {/* Previous Month Days */}
          {prevMonthDays.map((d, idx) => (
            <div key={`prev-${idx}`} className="calendar-day-cell" style={{ minHeight: '90px', padding: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.1)', opacity: 0.3, fontSize: '0.8rem' }}>
              {d}
            </div>
          ))}

          {/* Current Month Days */}
          {currentMonthDays.map((day) => {
            const dayTasks = tasksByDay[day] || [];
            const isCurrentDay = isToday(day);

            return (
              <div
                key={`day-${day}`}
                className="calendar-day-cell"
                style={{
                  minHeight: '100px',
                  padding: '0.5rem',
                  borderRadius: '10px',
                  background: isCurrentDay ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-tertiary)',
                  border: isCurrentDay ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: isCurrentDay ? 800 : 600,
                      color: isCurrentDay ? 'var(--accent-primary)' : 'var(--text-primary)'
                    }}
                  >
                    {day}
                  </span>
                  {dayTasks.length > 0 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {dayTasks.length} tasks
                    </span>
                  )}
                </div>

                {/* Day Tasks List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onEdit(t)}
                      style={{
                        padding: '0.25rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: t.category_color ? `${t.category_color}25` : 'rgba(99, 102, 241, 0.2)',
                        color: t.category_color || '#a5b4fc',
                        borderLeft: `3px solid ${t.category_color || '#6366f1'}`,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
