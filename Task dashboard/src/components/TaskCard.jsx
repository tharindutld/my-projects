import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";

export default function TaskCard({ task, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.7 : 1,
    boxShadow: isDragging ? "0 8px 16px rgba(0,0,0,0.25)" : "0 1px 4px rgba(0,0,0,0.1)",
  };

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description);

  const handleEdit = () => {
    if (title.trim() && desc.trim()) {
      onEdit(task.id, title, desc);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white rounded-xl shadow-md mb-4 cursor-move p-4 hover:shadow-lg transition-shadow"
    >
      {isEditing ? (
        <div>
          <input
            className="w-full mb-3 p-2 rounded border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task Title"
          />
          <textarea
            className="w-full mb-4 p-2 rounded border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Task Description"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleEdit}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h4 className="font-semibold text-indigo-700 text-lg">{task.title}</h4>
          <p className="text-indigo-900 text-sm mt-1 whitespace-pre-wrap">{task.description}</p>
        </div>
      )}
    </div>
  );
}
