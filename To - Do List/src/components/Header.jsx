import React from 'react';
import { 
  Search, 
  Plus, 
  LayoutList, 
  Kanban, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Sun, 
  Moon, 
  Database, 
  User,
  Zap
} from 'lucide-react';

export default function Header({
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  theme,
  toggleTheme,
  dbOnline,
  user,
  onOpenAuth,
  onNewTask
}) {
  return (
    <header className="header-bar">
      <div className="flex items-center gap-4">
        {/* Brand logo for mobile/collapsed view */}
        <div className="brand-logo" style={{ fontSize: '1.25rem' }}>
          <Zap className="w-6 h-6 text-indigo-500" style={{ color: '#6366f1' }} />
          <span>TaskPulse</span>
        </div>

        {/* Search Bar */}
        <div className="search-box">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks, tags, notes... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="view-tabs">
        <button
          className={`view-tab ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => setActiveView('list')}
        >
          <LayoutList size={16} />
          <span>List</span>
        </button>
        <button
          className={`view-tab ${activeView === 'board' ? 'active' : ''}`}
          onClick={() => setActiveView('board')}
        >
          <Kanban size={16} />
          <span>Board</span>
        </button>
        <button
          className={`view-tab ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveView('calendar')}
        >
          <CalendarIcon size={16} />
          <span>Calendar</span>
        </button>
        <button
          className={`view-tab ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics')}
        >
          <BarChart3 size={16} />
          <span>Analytics</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Database Status Indicator */}
        <div className={`db-status ${dbOnline ? 'db-online' : 'db-offline'}`} title={dbOnline ? 'MySQL Connected' : 'Running Offline Mode (LocalStorage Persistent)'}>
          <Database size={13} />
          <span>{dbOnline ? 'MySQL Live' : 'Local Sync'}</span>
        </div>

        {/* Theme Toggle */}
        <button className="btn-icon" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Account / Login */}
        <button className="btn-secondary btn-icon" onClick={onOpenAuth} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
          {user ? (
            <>
              <span style={{ fontSize: '1rem' }}>{user.avatar || '⚡'}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
            </>
          ) : (
            <>
              <User size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sign In</span>
            </>
          )}
        </button>

        {/* New Task CTA */}
        <button className="btn btn-primary" onClick={onNewTask}>
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
