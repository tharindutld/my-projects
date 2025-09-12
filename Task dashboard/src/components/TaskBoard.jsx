import React from "react";
import AddTaskForm from "./AddTaskForm";
import TaskColumn from "./TaskColumn";
import { DndContext } from "@dnd-kit/core";

const statusColors = {
  "To Do": "bg-blue-100",
  "In Progress": "bg-yellow-100",
  "Completed": "bg-green-100",
};

// Hook to manage tasks state and actions
function useTasks() {
  const [tasks, setTasks] = React.useState([
    
  ]);

  const addTask = (title, description) => {
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      status: "To Do",
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, status: newStatus } : task))
    );
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const editTask = (taskId, newTitle, newDescription) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, title: newTitle, description: newDescription } : task
      )
    );
  };

  return { tasks, addTask, updateTaskStatus, deleteTask, editTask };
}

export default function TaskBoard() {
  const { tasks, addTask, updateTaskStatus, deleteTask, editTask } = useTasks();
  const statuses = ["To Do", "In Progress", "Completed"];

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (active.data.current.status !== over.id) {
      updateTaskStatus(active.id, over.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <h1 className="text-4xl font-extrabold text-center text-purple-700 mb-8 drop-shadow-md">
        Task Dashboard
      </h1>
      <AddTaskForm onAdd={addTask} />

      <button
        onClick={() => {
          if (tasks.length > 0) {
            console.log("Global delete first task", tasks[0].id);
            deleteTask(tasks[0].id);
          }
        }}
        className="bg-red-500 text-white px-4 py-2 mt-4 rounded"
      >
        Delete First Task
      </button>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {statuses.map(status => (
            <div
              key={status}
              className={`${statusColors[status]} rounded-lg shadow-lg p-4 flex flex-col`}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                {status}
              </h2>
              <TaskColumn
                status={status}
                tasks={tasks.filter(task => task.status === status)}
                onDelete={deleteTask}
                onEdit={editTask}
              />
              {tasks.filter(task => task.status === status).length === 0 && (
                <p className="mt-auto text-gray-500 italic text-center select-none">
                  No tasks here yet.
                </p>
              )}
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
