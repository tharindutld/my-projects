// API service abstraction with LocalStorage fallback mechanism

const API_BASE = '/api';

// Initial local storage mock data
const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Work & Career', color: '#6366f1', icon: 'briefcase' },
  { id: 2, name: 'Personal Life', color: '#ec4899', icon: 'heart' },
  { id: 3, name: 'Tech & Projects', color: '#10b981', icon: 'code' },
  { id: 4, name: 'Health & Fitness', color: '#f59e0b', icon: 'activity' }
];

const DEFAULT_TASKS = [
  {
    id: 1,
    title: '🚀 Build Advanced React + MySQL Task Manager',
    description: 'Upgrade the simple HTML to-do list into a full-featured workspace with Kanban board, analytics, subtasks, and category tags.',
    status: 'in_progress',
    priority: 'urgent',
    category_id: 3,
    category_name: 'Tech & Projects',
    category_color: '#10b981',
    due_date: new Date(Date.now() + 86400000).toISOString(),
    is_starred: 1,
    is_pinned: 1,
    subtasks: [
      { id: 101, title: 'Fix XAMPP MySQL Aria engine startup issue', completed: 1 },
      { id: 102, title: 'Set up Express API routes and database pool', completed: 1 },
      { id: 103, title: 'Build React UI with Kanban & Analytics views', completed: 0 }
    ]
  },
  {
    id: 2,
    title: '📊 Review Weekly Productivity Metrics',
    description: 'Check team throughput and close out completed sprint cards.',
    status: 'todo',
    priority: 'high',
    category_id: 1,
    category_name: 'Work & Career',
    category_color: '#6366f1',
    due_date: new Date(Date.now() + 172800000).toISOString(),
    is_starred: 1,
    is_pinned: 0,
    subtasks: [
      { id: 201, title: 'Export monthly statistics', completed: 0 },
      { id: 202, title: 'Prepare slide deck for standup', completed: 0 }
    ]
  }
];

// Helper functions for LocalStorage
function getLocalTasks() {
  const data = localStorage.getItem('task_pulse_tasks');
  return data ? JSON.parse(data) : DEFAULT_TASKS;
}

function setLocalTasks(tasks) {
  localStorage.setItem('task_pulse_tasks', JSON.stringify(tasks));
}

function getLocalCategories() {
  const data = localStorage.getItem('task_pulse_categories');
  return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
}

function setLocalCategories(cats) {
  localStorage.setItem('task_pulse_categories', JSON.stringify(cats));
}

export const api = {
  // Health Check
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('API server down');
      const data = await res.json();
      return data.database === 'connected';
    } catch {
      return false;
    }
  },

  // Auth API
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || 'Login failed');
        err.field = data.field;
        throw err;
      }
      return data;
    } catch (err) {
      if (err.field) throw err;
      // Local demo fallback
      if (email === 'demo@example.com' || email.includes('@')) {
        const user = { id: 1, name: email.split('@')[0], email, phone: '0771234567', avatar: '🚀' };
        return { message: 'Offline Demo Login', token: 'demo_token', user };
      }
      throw err;
    }
  },

  async register(name, email, phone, password, avatar) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, avatar })
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || 'Registration failed');
        err.field = data.field;
        throw err;
      }
      return data;
    } catch (err) {
      if (err.field) throw err;
      const user = { id: Date.now(), name, email, phone, avatar: avatar || '⚡' };
      return { message: 'Account created offline!', token: 'demo_token', user };
    }
  },

  // Tasks API
  async getTasks(filters = {}) {
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_BASE}/tasks?${query}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return await res.json();
    } catch {
      // LocalStorage Fallback
      let tasks = getLocalTasks();
      if (filters.search) {
        const q = filters.search.toLowerCase();
        tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
      }
      if (filters.category) {
        tasks = tasks.filter(t => String(t.category_id) === String(filters.category));
      }
      if (filters.status) {
        tasks = tasks.filter(t => t.status === filters.status);
      }
      if (filters.priority) {
        tasks = tasks.filter(t => t.priority === filters.priority);
      }
      return tasks;
    }
  },

  async createTask(taskData) {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (!res.ok) throw new Error('Failed to create task');
      return await res.json();
    } catch {
      // Local fallback
      const tasks = getLocalTasks();
      const categories = getLocalCategories();
      const cat = categories.find(c => String(c.id) === String(taskData.category_id));

      const newTask = {
        id: Date.now(),
        ...taskData,
        category_name: cat ? cat.name : null,
        category_color: cat ? cat.color : '#6366f1',
        is_starred: taskData.is_starred ? 1 : 0,
        is_pinned: taskData.is_pinned ? 1 : 0,
        subtasks: (taskData.subtasks || []).map((s, idx) => ({
          id: Date.now() + idx,
          title: typeof s === 'string' ? s : s.title,
          completed: 0
        }))
      };

      tasks.unshift(newTask);
      setLocalTasks(tasks);
      return newTask;
    }
  },

  async updateTask(id, taskData) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (!res.ok) throw new Error('Failed to update task');
      return await res.json();
    } catch {
      const tasks = getLocalTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...taskData };
        setLocalTasks(tasks);
        return tasks[index];
      }
      throw new Error('Task not found');
    }
  },

  async toggleTask(id) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}/toggle`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to toggle task');
      return await res.json();
    } catch {
      const tasks = getLocalTasks();
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.status = task.status === 'completed' ? 'todo' : 'completed';
        setLocalTasks(tasks);
        return { id, status: task.status };
      }
    }
  },

  async deleteTask(id) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      return await res.json();
    } catch {
      const tasks = getLocalTasks().filter(t => t.id !== id);
      setLocalTasks(tasks);
      return { message: 'Task deleted' };
    }
  },

  // Categories API
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    } catch {
      return getLocalCategories();
    }
  },

  async createCategory(catData) {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category');
      return data;
    } catch (err) {
      if (err.message.includes('already exists')) throw err;
      const cats = getLocalCategories();
      const exists = cats.some(c => c.name.toLowerCase() === catData.name.trim().toLowerCase());
      if (exists) {
        throw new Error('A project tag with this name already exists.');
      }
      const newCat = { id: Date.now(), ...catData };
      cats.push(newCat);
      setLocalCategories(cats);
      return newCat;
    }
  },

  async deleteCategory(id) {
    try {
      await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
    } catch {
      const cats = getLocalCategories().filter(c => c.id !== id);
      setLocalCategories(cats);
    }
  }
};
