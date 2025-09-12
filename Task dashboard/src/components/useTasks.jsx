
import { useState } from "react";

export function useTasks() {
  const [tasks, setTasks] = useState([
   
    {
      id: "1",
      title: "Sample Task 1",
      description: "This is a To Do sample task",
      status: "To Do",
    },
    {
      id: "2",
      title: "Sample Task 2",
      description: "This is an In Progress sample task",
      status: "In Progress",
    },
    {
      id: "3",
      title: "Sample Task 3",
      description: "This is a Completed sample task",
      status: "Completed",
    },
  ]);

  const addTask = (title, description) => {
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      status: "To Do", 
    };
     console.log("Adding Task:", newTask);
    setTasks((prev) => [...prev, newTask]);
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const deleteTask = (taskId) => {
    console.log("Deleting task with id:", taskId);
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const editTask = (taskId, newTitle, newDescription) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, title: newTitle, description: newDescription }
          : task
      )
    );
  };

  return { tasks, addTask, updateTaskStatus, deleteTask, editTask };
}
