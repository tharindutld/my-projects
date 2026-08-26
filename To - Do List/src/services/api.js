// API service communicating directly with Express / MySQL database

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function parseJSON(res) {
  const text = await res.text();
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch (err) {
    return { error: text || `Server error (${res.status} ${res.statusText})` };
  }
}

export const api = {
  // Health Check
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) return false;
      const data = await parseJSON(res);
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
      const data = await parseJSON(res);
      if (!res.ok) {
        const err = new Error(data.error || 'Login failed');
        err.field = data.field;
        throw err;
      }
      return data;
    } catch (err) {
      if (err.field) throw err;
      throw new Error(err.message || 'Failed to connect to backend server on port 5000.');
    }
  },

  async register(name, email, phone, password, avatar) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, avatar })
      });
      const data = await parseJSON(res);
      if (!res.ok) {
        const err = new Error(data.error || 'Registration failed');
        err.field = data.field;
        throw err;
      }
      return data;
    } catch (err) {
      if (err.field) throw err;
      throw new Error(err.message || 'Failed to connect to backend server on port 5000.');
    }
  },

  async updateProfile(id, name, phone, avatar) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, phone, avatar })
      });
      const data = await parseJSON(res);
      if (!res.ok) {
        const err = new Error(data.error || 'Profile update failed');
        err.field = data.field;
        throw err;
      }
      return data;
    } catch (err) {
      if (err.field) throw err;
      throw new Error(err.message || 'Failed to connect to backend server on port 5000.');
    }
  },

  // Tasks API
  async getTasks(filters = {}) {
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_BASE}/tasks?${query}`);
      const data = await parseJSON(res);
      if (!res.ok) return [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async createTask(taskData) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    const data = await parseJSON(res);
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create task in MySQL database');
    }
    return data;
  },

  async updateTask(id, taskData) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    const data = await parseJSON(res);
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update task in MySQL database');
    }
    return data;
  },

  async toggleTask(id) {
    const res = await fetch(`${API_BASE}/tasks/${id}/toggle`, { method: 'PUT' });
    const data = await parseJSON(res);
    if (!res.ok) {
      throw new Error(data.error || 'Failed to toggle task status in database');
    }
    return data;
  },

  async deleteTask(id) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    const data = await parseJSON(res);
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete task from MySQL database');
    }
    return data;
  },

  // Categories API
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await parseJSON(res);
      if (!res.ok) return [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async createCategory(catData) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catData)
    });
    const data = await parseJSON(res);
    if (!res.ok) {
      const err = new Error(data.error || 'Failed to create category in database');
      if (data.error && data.error.includes('already exists')) {
        err.field = 'name';
      }
      throw err;
    }
    return data;
  },

  async deleteCategory(id) {
    const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
    const data = await parseJSON(res);
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete category from MySQL database');
    }
    return data;
  }
};
