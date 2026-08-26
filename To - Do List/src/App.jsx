import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ListView from './components/ListView';
import KanbanBoard from './components/KanbanBoard';
import CalendarView from './components/CalendarView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TaskModal from './components/TaskModal';
import CategoryModal from './components/CategoryModal';
import AuthModal from './components/AuthModal';
import ConfirmModal from './components/ConfirmModal';
import { api } from './services/api';

export default function App() {
  // App View State
  const [activeView, setActiveView] = useState('list'); // 'list', 'board', 'calendar', 'analytics'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'today', 'upcoming', 'urgent', 'starred', 'completed'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('task_pulse_theme') || 'light');

  // Data State
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('task_pulse_user') || 'null'));
  const [dbOnline, setDbOnline] = useState(false);

  // Modals State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Apply Theme to Document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('task_pulse_theme', theme);
  }, [theme]);

  // Initial Data & Database Connection Health Check
  const loadData = async () => {
    const isConnected = await api.checkHealth();
    setDbOnline(isConnected);

    const cats = await api.getCategories();
    setCategories(cats);

    const taskList = await api.getTasks({
      search: searchQuery,
      category: selectedCategory,
      userId: user ? user.id : undefined
    });
    setTasks(taskList);
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, user]);

  // Periodic health check
  useEffect(() => {
    const interval = setInterval(async () => {
      const isConnected = await api.checkHealth();
      setDbOnline(isConnected);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEditingTask(null);
        setIsTaskModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Task Operations
  const handleSaveTask = async (taskData) => {
    if (taskData.id) {
      const updated = await api.updateTask(taskData.id, taskData);
      setTasks((prev) => prev.map((t) => (t.id === taskData.id ? { ...t, ...updated } : t)));
    } else {
      const created = await api.createTask({ ...taskData, user_id: user ? user.id : null });
      setTasks((prev) => [created, ...prev]);
    }
  };

  const handleToggleStatus = async (id) => {
    const res = await api.toggleTask(id);
    if (res) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: res.status } : t))
      );

      if (res.status === 'completed') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    }
  };

  const handleUpdateTaskStatus = async (id, newStatus) => {
    const updated = await api.updateTask(id, { status: newStatus });
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));

    if (newStatus === 'completed') {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.8 }
      });
    }
  };

  const handleToggleStar = async (id, isStarred) => {
    await api.updateTask(id, { is_starred: isStarred ? 1 : 0 });
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, is_starred: isStarred ? 1 : 0 } : t)));
  };

  const handleTogglePin = async (id, isPinned) => {
    await api.updateTask(id, { is_pinned: isPinned ? 1 : 0 });
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, is_pinned: isPinned ? 1 : 0 } : t)));
  };

  const handleDeleteTask = (id) => {
    const foundTask = tasks.find((t) => t.id === id);
    if (foundTask) {
      setTaskToDelete(foundTask);
    } else {
      setTaskToDelete({ id, title: 'Selected Task' });
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    await api.deleteTask(taskToDelete.id);
    setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
    setTaskToDelete(null);
  };

  // Category Operations
  const handleSaveCategory = async (catData) => {
    const created = await api.createCategory(catData);
    setCategories((prev) => [...prev, created]);
  };

  const handleDeleteCategory = async (catId) => {
    await api.deleteCategory(catId);
    setCategories((prev) => prev.filter((c) => String(c.id) !== String(catId)));
    setTasks((prev) =>
      prev.map((t) => (String(t.category_id) === String(catId) ? { ...t, category_id: null, category_name: null } : t))
    );
    if (String(selectedCategory) === String(catId)) {
      setSelectedCategory(null);
    }
  };

  // Auth Operations
  const handleLogin = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    localStorage.setItem('task_pulse_user', JSON.stringify(data.user));
    localStorage.setItem('task_pulse_token', data.token);
    loadData();
  };

  const handleRegister = async (name, email, phone, password, avatar) => {
    const data = await api.register(name, email, phone, password, avatar);
    setUser(data.user);
    localStorage.setItem('task_pulse_user', JSON.stringify(data.user));
    localStorage.setItem('task_pulse_token', data.token);
    loadData();
  };

  const handleDemoLogin = () => {
    const demoUser = { id: 1, name: 'Demo User', email: 'demo@example.com', phone: '0771234567', avatar: '🚀' };
    setUser(demoUser);
    localStorage.setItem('task_pulse_user', JSON.stringify(demoUser));
    localStorage.setItem('task_pulse_token', 'demo_token');
    loadData();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('task_pulse_user');
    localStorage.removeItem('task_pulse_token');
    loadData();
  };

  // Calculate filtered tasks for views
  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);

  const displayedTasks = tasks.filter((t) => {
    if (selectedCategory && String(t.category_id) !== String(selectedCategory)) {
      return false;
    }
    if (activeFilter === 'today') {
      return t.due_date && t.due_date.startsWith(todayStr);
    }
    if (activeFilter === 'upcoming') {
      return t.due_date && new Date(t.due_date) > now;
    }
    if (activeFilter === 'urgent') {
      return t.priority === 'urgent';
    }
    if (activeFilter === 'starred') {
      return t.is_starred === 1;
    }
    if (activeFilter === 'completed') {
      return t.status === 'completed';
    }
    return true;
  });

  // Calculate Task Stats
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    today: tasks.filter((t) => t.due_date && t.due_date.startsWith(todayStr)).length,
    upcoming: tasks.filter((t) => t.due_date && new Date(t.due_date) > now).length,
    urgent: tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length,
    starred: tasks.filter((t) => t.is_starred === 1).length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100) : 0
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        categories={categories}
        tasks={tasks}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onDeleteCategory={handleDeleteCategory}
        taskStats={taskStats}
      />

      {/* Main Area */}
      <div className="main-content">
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          theme={theme}
          toggleTheme={toggleTheme}
          dbOnline={dbOnline}
          user={user}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onNewTask={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
        />

        {/* Viewport Content */}
        <main className="content-viewport">
          {activeView === 'list' && (
            <ListView
              tasks={displayedTasks}
              categories={categories}
              selectedCategory={selectedCategory}
              onToggleStatus={handleToggleStatus}
              onToggleStar={handleToggleStar}
              onTogglePin={handleTogglePin}
              onEdit={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
              onDelete={handleDeleteTask}
              onNewTask={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            />
          )}

          {activeView === 'board' && (
            <KanbanBoard
              tasks={displayedTasks}
              onToggleStatus={handleToggleStatus}
              onToggleStar={handleToggleStar}
              onTogglePin={handleTogglePin}
              onEdit={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
              onDelete={handleDeleteTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onNewTask={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView
              tasks={tasks}
              onEdit={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsDashboard tasks={tasks} categories={categories} />
          )}
        </main>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        categories={categories}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        categories={categories}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onDemoLogin={handleDemoLogin}
        taskStats={taskStats}
        onUpdateUser={async (name, phone, avatar) => {
          if (!user) return;
          const res = await api.updateProfile(user.id, name, phone, avatar);
          setUser(res.user);
          localStorage.setItem('task_pulse_user', JSON.stringify(res.user));
        }}
      />

      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDeleteTask}
        title="Confirm Task Deletion"
        message={
          <>
            Are you sure you want to delete task <strong>"{taskToDelete?.title}"</strong>?
          </>
        }
        confirmText="Delete Task"
      />
    </div>
  );
}
