
import axios from "axios";

const API_BASE = "http://localhost:3001";

export const fetchTasks = () => axios.get(`${API_BASE}/tasks`);
export const addTask = (task) => axios.post(`${API_BASE}/tasks`, task);
export const updateTask = (id, updatedTask) =>
axios.put(`${API_BASE}/tasks/${id}`, updatedTask);
export const deleteTask = (id) => axios.delete(`${API_BASE}/tasks/${id}`);
