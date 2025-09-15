import React, { useState } from "react";

export default function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      onAdd(title, description);
      setTitle("");
      setDescription("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 p-8 rounded-2xl shadow-lg max-w-lg mx-auto border border-gray-200"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Add New Task
      </h2>

      <input
        type="text"
        placeholder="Enter task title"
        className="w-full p-3 mb-4 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Enter task description"
        rows={4}
        className="w-full p-3 mb-4 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button
        type="submit"
        className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 transition transform hover:scale-[1.02] shadow-md hover:shadow-lg"
      >
        Add Task
      </button>
    </form>
  );
}
