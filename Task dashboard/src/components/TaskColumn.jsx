import React from "react";
import TaskCard from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

function Droppable({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`p-2 min-h-[200px] rounded transition ${
        isOver ? "bg-blue-100" : "bg-gray-100"
      }`}
    >
      {children}
    </div>
  );
}

export default function TaskColumn({ status, tasks, onDelete, onEdit }) {
  const items = tasks.map(t => t.id);

  return (
    <div>
      
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <Droppable id={status}>
          {items.map((id) => {
            const task = tasks.find(t => t.id === id);
            return task ? (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ) : null;
          })}
        </Droppable>
      </SortableContext>
    </div>
  );
}
